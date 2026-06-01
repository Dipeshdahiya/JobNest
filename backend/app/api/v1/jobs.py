"""Jobs router — CRUD and listing."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
import random

from app.core.dependencies import get_current_user, require_role
from app.db.enums import UserRole
from app.db.session import get_db_session
from app.models.user import User
from app.models.job import Job, JobEditApprovalToken
from app.schemas.job import JobCreate, JobRead, JobUpdate
from app.schemas.bookmark import BookmarkMessage
from app.services.job_service import JobService
from app.services.profile_service import ProfileService
from app.services.bookmark_service import BookmarkService
from app.services.email_service import EmailService
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _job_service(db: AsyncSession = Depends(get_db_session)) -> JobService:
    return JobService(db)


def _profile_service(db: AsyncSession = Depends(get_db_session)) -> ProfileService:
    return ProfileService(db)


def _bookmark_service(db: AsyncSession = Depends(get_db_session)) -> BookmarkService:
    return BookmarkService(db)


def _email_service() -> EmailService:
    return EmailService()


@router.post(
    "",
    response_model=JobRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a job posting (employer only)",
)
async def create_job(
    payload: JobCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    job_svc: Annotated[JobService, Depends(_job_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
):
    employer_profile = await profile_svc.get_employer_profile(current_user.id)
    if employer_profile is None:
        # Fallback to the shared company profile for this domain
        domain = current_user.email.split("@")[-1].lower()
        employer_profile = await profile_svc.get_company_profile_by_domain(domain)
    if employer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Create an employer profile before posting jobs",
        )
    job = await job_svc.create(employer_profile.id, payload)
    # Re-fetch to eagerly load employer_profile for company_name
    job = await job_svc.get_by_id(job.id)
    return JobRead.model_validate(job)


@router.get(
    "",
    response_model=list[JobRead],
    summary="Search & filter jobs",
)
async def list_jobs(
    job_svc: Annotated[JobService, Depends(_job_service)],
    pagination: Annotated[PaginationParams, Depends()],
    keyword: str | None = Query(None, description="Search in title/description"),
    location: str | None = Query(None),
    experience_level: str | None = Query(None),
    job_type: str | None = Query(None),
    is_remote: bool | None = Query(None),
):
    jobs = await job_svc.list_jobs(
        skip=pagination.skip,
        limit=pagination.limit,
        keyword=keyword,
        location=location,
        experience_level=experience_level,
        job_type=job_type,
        is_remote=is_remote,
    )
    return [JobRead.model_validate(j) for j in jobs]


@router.get(
    "/employer/me",
    response_model=list[JobRead],
    summary="List own posted jobs (employer only)",
)
async def list_my_jobs(
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    job_svc: Annotated[JobService, Depends(_job_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
    pagination: Annotated[PaginationParams, Depends()],
):
    # Share the same "company dashboard" across all employees with the same
    # email domain by aggregating jobs for every employer profile that belongs
    # to a user with this domain.
    domain = current_user.email.split("@")[-1].lower()
    employer_profiles = await profile_svc.get_employer_profiles_by_domain(domain)
    if not employer_profiles:
        return []

    employer_ids = [ep.id for ep in employer_profiles]
    jobs = await job_svc.list_by_employers(
        employer_ids, pagination.skip, pagination.limit
    )
    return [JobRead.model_validate(j) for j in jobs]


@router.get(
    "/saved",
    response_model=list[JobRead],
    summary="List saved jobs (seeker only)",
)
async def list_saved_jobs_route(
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    bookmark_svc: Annotated[BookmarkService, Depends(_bookmark_service)],
    pagination: Annotated[PaginationParams, Depends()],
):
    jobs = await bookmark_svc.list_saved_jobs(
        current_user.id, pagination.skip, pagination.limit
    )
    return [JobRead.model_validate(j) for j in jobs]


@router.get(
    "/recommendations",
    response_model=list[JobRead],
    summary="Get job recommendations (seeker only)",
)
async def get_recommendations(
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    job_svc: Annotated[JobService, Depends(_job_service)],
):
    jobs = await job_svc.get_recommended_jobs(current_user.id)
    return [JobRead.model_validate(j) for j in jobs]


@router.get(
    "/{job_id}",
    response_model=JobRead,
    summary="Get job detail (increments view count)",
)
async def get_job(
    job_id: uuid.UUID,
    job_svc: Annotated[JobService, Depends(_job_service)],
):
    job = await job_svc.get_by_id(job_id, increment_views=True)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    return JobRead.model_validate(job)


@router.patch(
    "/{job_id}",
    response_model=JobRead,
    summary="Update a job (employer only, company owner)",
)
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    job_svc: Annotated[JobService, Depends(_job_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
):
    employer_profile = await profile_svc.get_employer_profile(current_user.id)
    if employer_profile is None:
        domain = current_user.email.split("@")[-1].lower()
        employer_profile = await profile_svc.get_company_profile_by_domain(domain)
    if employer_profile is None or employer_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company owner can edit jobs directly. Use delegated edit with OTP.",
        )
    job = await job_svc.update(job_id, employer_profile.id, payload)
    return JobRead.model_validate(job)


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archive a job (employer only, company owner)",
)
async def delete_job(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    job_svc: Annotated[JobService, Depends(_job_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
):
    employer_profile = await profile_svc.get_employer_profile(current_user.id)
    if employer_profile is None:
        domain = current_user.email.split("@")[-1].lower()
        employer_profile = await profile_svc.get_company_profile_by_domain(domain)
    if employer_profile is None or employer_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company owner can archive jobs directly. Use delegated edit with OTP.",
        )
    await job_svc.delete(job_id, employer_profile.id)


class DelegatedJobUpdate(JobUpdate):
    otp_code: str


@router.post(
    "/{job_id}/edit-otp/request",
    status_code=status.HTTP_200_OK,
    summary="Request OTP to edit a job posted by another employee (same company domain)",
)
async def request_job_edit_otp(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    email_svc: Annotated[EmailService, Depends(_email_service)],
    db: AsyncSession = Depends(get_db_session),
):
    # Load job and owner (company owner)
    result = await db.execute(
        select(Job)
        .where(Job.id == job_id)
        .options(selectinload(Job.employer_profile).selectinload("employer_profile.user"))
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    owner = job.employer_profile.user  # type: ignore[attr-defined]
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job owner not found for this posting",
        )

    if current_user.id == owner.id:
        return {"message": "You are the job owner; no OTP is required."}

    # Enforce same company domain
    owner_domain = owner.email.split("@")[-1].lower()
    requester_domain = current_user.email.split("@")[-1].lower()
    if owner_domain != requester_domain:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees from the same company domain can request edit access.",
        )

    # Generate OTP
    otp_code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    token = JobEditApprovalToken(
        job_id=job.id,
        owner_user_id=owner.id,
        requester_user_id=current_user.id,
        otp_code=otp_code,
        expires_at=expires_at,
    )
    db.add(token)
    await db.flush()

    # Email OTP to owner
    await email_svc.send_job_edit_otp(
        owner_email=owner.email,
        requester_email=current_user.email,
        job_title=job.title,
        otp_code=otp_code,
    )

    return {"message": "An approval code has been sent to the job owner's email."}


@router.patch(
    "/{job_id}/delegated",
    response_model=JobRead,
    summary="Update a job using an OTP approved by the job owner (same company domain employees)",
)
async def delegated_update_job(
    job_id: uuid.UUID,
    payload: DelegatedJobUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    job_svc: Annotated[JobService, Depends(_job_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
    db: AsyncSession = Depends(get_db_session),
):
    job = await job_svc.get_by_id(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    employer_profile = await profile_svc.get_company_profile_by_domain(
        current_user.email.split("@")[-1].lower()
    )
    if employer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employer profile required.",
        )

    # Find latest unused OTP token for this job + requester
    result = await db.execute(
        select(JobEditApprovalToken)
        .where(
            JobEditApprovalToken.job_id == job_id,
            JobEditApprovalToken.requester_user_id == current_user.id,
            JobEditApprovalToken.is_used == False,  # noqa: E712
        )
        .order_by(JobEditApprovalToken.created_at.desc())
    )
    token = result.scalars().first()

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending edit approval found for this job.",
        )

    if token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The approval code has expired.",
        )

    if token.otp_code != payload.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid approval code.",
        )

    # Mark token as used
    token.is_used = True
    await db.flush()

    # Perform update on behalf of the company owner (employer_profile_id)
    job = await job_svc.update(job_id, employer_profile.id, payload)
    return JobRead.model_validate(job)


@router.post(
    "/{job_id}/save",
    response_model=BookmarkMessage,
    status_code=status.HTTP_200_OK,
    summary="Save a job (seeker only)",
)
async def save_job(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    bookmark_svc: Annotated[BookmarkService, Depends(_bookmark_service)],
):
    await bookmark_svc.save_job(current_user.id, job_id)
    return {"message": "Job saved successfully"}


@router.delete(
    "/{job_id}/unsave",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unsave a job (seeker only)",
)
async def unsave_job(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    bookmark_svc: Annotated[BookmarkService, Depends(_bookmark_service)],
):
    await bookmark_svc.unsave_job(current_user.id, job_id)
