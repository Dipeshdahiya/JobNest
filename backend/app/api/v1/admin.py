"""Admin router — minimal user and job management."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.db.enums import UserRole
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.job import JobRead
from app.schemas.user import UserRead
from app.services.job_service import JobService
from app.services.user_service import UserService
from app.utils.pagination import PaginationParams
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

class PlatformStatsResponse(BaseModel):
    total_users: int
    total_seekers: int
    total_employers: int
    total_jobs: int
    total_posts: int
    total_applications: int



def _user_service(db: AsyncSession = Depends(get_db_session)) -> UserService:
    return UserService(db)


def _job_service(db: AsyncSession = Depends(get_db_session)) -> JobService:
    return JobService(db)


@router.get(
    "/users",
    response_model=list[UserRead],
    summary="List all users (admin only)",
)
async def list_users(
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    svc: Annotated[UserService, Depends(_user_service)],
    pagination: Annotated[PaginationParams, Depends()],
):
    return await svc.list_all(pagination.skip, pagination.limit)


@router.patch(
    "/users/{user_id}/deactivate",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a user (admin only)",
)
async def deactivate_user(
    user_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    svc: Annotated[UserService, Depends(_user_service)],
):
    await svc.deactivate(user_id)


@router.get(
    "/jobs",
    response_model=list[JobRead],
    summary="List all jobs (admin only)",
)
async def list_all_jobs(
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    job_svc: Annotated[JobService, Depends(_job_service)],
    pagination: Annotated[PaginationParams, Depends()],
):
    return await job_svc.list_jobs(
        skip=pagination.skip,
        limit=pagination.limit,
        status_filter=None,  # Show all statuses for admin
    )


@router.patch(
    "/jobs/{job_id}/deactivate",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archive/deactivate a job (admin only)",
)
async def deactivate_job(
    job_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    job_svc: Annotated[JobService, Depends(_job_service)],
):
    from datetime import datetime, timezone
    from app.db.enums import JobStatus

    job = await job_svc.get_by_id(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    job.status = JobStatus.ARCHIVED
    job.deleted_at = datetime.now(timezone.utc)
    await job_svc.db.flush()


@router.delete(
    "/posts/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a post (admin only)",
)
async def delete_post(
    post_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: AsyncSession = Depends(get_db_session),
):
    from datetime import datetime, timezone
    from sqlalchemy import select
    from app.models.social import Post

    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    
    post.deleted_at = datetime.now(timezone.utc)
    await db.flush()


@router.get(
    "/stats",
    response_model=PlatformStatsResponse,
    summary="Get platform statistics (admin only)",
)
async def get_platform_stats(
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: AsyncSession = Depends(get_db_session),
):
    from sqlalchemy import select, func
    from app.models.profile import SeekerProfile, EmployerProfile
    from app.models.job import Job
    from app.models.social import Post
    from app.models.application import Application
    
    total_users_q = await db.execute(select(func.count(User.id)))
    total_users = total_users_q.scalar_one()
    
    total_seekers_q = await db.execute(select(func.count(SeekerProfile.id)))
    total_seekers = total_seekers_q.scalar_one()
    
    total_employers_q = await db.execute(select(func.count(EmployerProfile.id)))
    total_employers = total_employers_q.scalar_one()
    
    total_jobs_q = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_q.scalar_one()
    
    total_posts_q = await db.execute(select(func.count(Post.id)))
    total_posts = total_posts_q.scalar_one()
    
    total_applications_q = await db.execute(select(func.count(Application.id)))
    total_applications = total_applications_q.scalar_one()
    
    return PlatformStatsResponse(
        total_users=total_users,
        total_seekers=total_seekers,
        total_employers=total_employers,
        total_jobs=total_jobs,
        total_posts=total_posts,
        total_applications=total_applications,
    )
