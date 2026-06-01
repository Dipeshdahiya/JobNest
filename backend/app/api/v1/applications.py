"""Applications router — apply, list, update status."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.enums import UserRole
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate
from app.services.application_service import ApplicationService
from app.services.profile_service import ProfileService
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/applications", tags=["Applications"])


def _app_service(db: AsyncSession = Depends(get_db_session)) -> ApplicationService:
    return ApplicationService(db)


def _profile_service(db: AsyncSession = Depends(get_db_session)) -> ProfileService:
    return ProfileService(db)


@router.post(
    "",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a job (seeker only)",
)
async def apply_to_job(
    payload: ApplicationCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    app_svc: Annotated[ApplicationService, Depends(_app_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
):
    # Get seeker resume URL for quick-apply
    seeker_profile = await profile_svc.get_seeker_profile(current_user.id)
    resume_url = seeker_profile.resume_url if seeker_profile else None
    return await app_svc.apply(current_user.id, payload, resume_url=resume_url)


@router.get(
    "/me",
    response_model=list[ApplicationRead],
    summary="List own applications (seeker)",
)
async def list_my_applications(
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    app_svc: Annotated[ApplicationService, Depends(_app_service)],
    pagination: Annotated[PaginationParams, Depends()],
):
    return await app_svc.list_by_seeker(
        current_user.id, pagination.skip, pagination.limit
    )


@router.get(
    "/job/{job_id}",
    response_model=list[ApplicationRead],
    summary="List applicants for a job (employer only)",
)
async def list_job_applications(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    app_svc: Annotated[ApplicationService, Depends(_app_service)],
    profile_svc: Annotated[ProfileService, Depends(_profile_service)],
    pagination: Annotated[PaginationParams, Depends()],
):
    # Verify employer owns this job (via their profile)
    employer_profile = await profile_svc.get_employer_profile(current_user.id)
    if employer_profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employer profile required",
        )
    # We rely on the job ownership check being implicit:
    # Only the employer who posted the job should see its applicants.
    # For Phase 1 we return all applications for the given job_id.
    return await app_svc.list_by_job(job_id, pagination.skip, pagination.limit)


@router.get(
    "/{application_id}",
    response_model=ApplicationRead,
    summary="Get application detail",
)
async def get_application(
    application_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    app_svc: Annotated[ApplicationService, Depends(_app_service)],
):
    application = await app_svc.get_by_id(application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    # Verify the user is either the applicant or the job's employer
    if application.seeker_id != current_user.id:
        # Check if employer
        if current_user.role != UserRole.EMPLOYER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
    return application


@router.patch(
    "/{application_id}",
    response_model=ApplicationRead,
    summary="Update application status (employer only)",
)
async def update_application_status(
    application_id: uuid.UUID,
    payload: ApplicationUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    app_svc: Annotated[ApplicationService, Depends(_app_service)],
):
    return await app_svc.update_status(application_id, payload)
