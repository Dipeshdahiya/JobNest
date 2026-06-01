"""Bookmark service for saving jobs."""

import uuid
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job, SavedJob
from app.db.enums import JobStatus


class BookmarkService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_job(self, user_id: uuid.UUID, job_id: uuid.UUID) -> None:
        """Save a job for a seeker."""
        # Validate job exists and is open
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job or job.status != JobStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job not found or not open",
            )
            
        # Prevent duplicates
        existing = await self.db.execute(
            select(SavedJob).where(
                and_(SavedJob.user_id == user_id, SavedJob.job_id == job_id)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is already saved",
            )
            
        saved_job = SavedJob(user_id=user_id, job_id=job_id)
        self.db.add(saved_job)
        await self.db.flush()

    async def unsave_job(self, user_id: uuid.UUID, job_id: uuid.UUID) -> None:
        """Unsave a job."""
        result = await self.db.execute(
            select(SavedJob).where(
                and_(SavedJob.user_id == user_id, SavedJob.job_id == job_id)
            )
        )
        saved_job = result.scalar_one_or_none()
        
        if not saved_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved job not found",
            )
            
        await self.db.delete(saved_job)
        await self.db.flush()

    async def list_saved_jobs(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Job]:
        """List saved jobs for user."""
        result = await self.db.execute(
            select(Job)
            .join(SavedJob, SavedJob.job_id == Job.id)
            .where(SavedJob.user_id == user_id)
            .options(selectinload(Job.skills), selectinload(Job.employer_profile))
            .offset(skip)
            .limit(limit)
            .order_by(SavedJob.created_at.desc())
        )
        return list(result.scalars().all())
