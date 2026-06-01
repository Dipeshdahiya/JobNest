"""Application service — apply, list, update status."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.application import Application
from app.models.job import Job
from app.schemas.application import ApplicationCreate, ApplicationUpdate


from app.services.email_service import EmailService

class ApplicationService:
    """Application lifecycle management."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def apply(
        self,
        seeker_id: uuid.UUID,
        payload: ApplicationCreate,
        resume_url: str | None = None,
    ) -> Application:
        # Check if job exists and is open
        result = await self.db.execute(
            select(Job).where(Job.id == payload.job_id, Job.deleted_at.is_(None))
        )
        job = result.scalar_one_or_none()
        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )
        if job.status.value != "open":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job is no longer accepting applications",
            )

        # Check duplicate
        existing = await self.db.execute(
            select(Application).where(
                Application.job_id == payload.job_id,
                Application.seeker_id == seeker_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already applied to this job",
            )

        application = Application(
            job_id=payload.job_id,
            seeker_id=seeker_id,
            cover_letter=payload.cover_letter,
            resume_url=resume_url,
        )
        self.db.add(application)

        # Increment job applications count atomically
        await self.db.execute(
            sa_update(Job)
            .where(Job.id == payload.job_id)
            .values(applications_count=Job.applications_count + 1)
        )

        await self.db.flush()
        await self.db.refresh(application)
        return application

    async def get_by_id(self, application_id: uuid.UUID) -> Application | None:
        result = await self.db.execute(
            select(Application)
            .where(Application.id == application_id)
            .options(selectinload(Application.job), selectinload(Application.seeker))
        )
        return result.scalar_one_or_none()

    async def list_by_job(
        self, job_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[Application]:
        result = await self.db.execute(
            select(Application)
            .where(Application.job_id == job_id)
            .options(selectinload(Application.seeker))
            .order_by(Application.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_by_seeker(
        self, seeker_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[Application]:
        result = await self.db.execute(
            select(Application)
            .where(Application.seeker_id == seeker_id)
            .options(selectinload(Application.job))
            .order_by(Application.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_status(
        self, application_id: uuid.UUID, payload: ApplicationUpdate
    ) -> Application:
        application = await self.get_by_id(application_id)
        if application is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )
            
        old_status = application.status

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(application, field, value)

        await self.db.flush()
        await self.db.refresh(application)
        
        # Send email notification if status changed
        if payload.status and old_status != payload.status:
            email_svc = EmailService()
            job_title = application.job.title if application.job else "a job"
            await email_svc.send_application_status_update(
                to_email=application.seeker.email,
                job_title=job_title,
                new_status=payload.status.value,
            )
            
        return application
