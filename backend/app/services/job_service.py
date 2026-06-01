"""Job service — CRUD and listing for jobs."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, update as sa_update, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.enums import JobStatus
from app.models.job import Job, Skill, job_skills
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    """Job CRUD operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, employer_profile_id: uuid.UUID, payload: JobCreate) -> Job:
        data = payload.model_dump(exclude={"skill_ids"})
        job = Job(employer_profile_id=employer_profile_id, **data)

        # Associate skills
        if payload.skill_ids:
            result = await self.db.execute(
                select(Skill).where(Skill.id.in_(payload.skill_ids))
            )
            skills = list(result.scalars().all())
            job.skills = skills

        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def get_by_id(
        self, job_id: uuid.UUID, increment_views: bool = False
    ) -> Job | None:
        result = await self.db.execute(
            select(Job)
            .where(Job.id == job_id, Job.deleted_at.is_(None))
            .options(
                selectinload(Job.skills),
                selectinload(Job.employer_profile),
            )
        )
        job = result.scalar_one_or_none()

        if job is not None and increment_views:
            await self.db.execute(
                sa_update(Job)
                .where(Job.id == job_id)
                .values(views_count=Job.views_count + 1)
            )
            await self.db.flush()
            await self.db.refresh(job)  # re-fetch expired attrs (updated_at, etc.)

        return job

    _SENTINEL = object()

    async def list_jobs(
        self,
        skip: int = 0,
        limit: int = 20,
        keyword: str | None = None,
        location: str | None = None,
        experience_level: str | None = None,
        job_type: str | None = None,
        is_remote: bool | None = None,
        status_filter: str | None | object = _SENTINEL,
    ) -> list[Job]:
        query = (
            select(Job)
            .where(Job.deleted_at.is_(None))
            .options(selectinload(Job.skills), selectinload(Job.employer_profile))
        )

        # status_filter=_SENTINEL => default (open only)
        # status_filter=None     => all statuses (admin)
        # status_filter="open"   => specific status
        if status_filter is self._SENTINEL:
            query = query.where(Job.status == JobStatus.OPEN)
        elif status_filter is not None:
            query = query.where(Job.status == status_filter)

        if keyword:
            pattern = f"%{keyword}%"
            query = query.where(
                or_(
                    Job.title.ilike(pattern),
                    Job.description.ilike(pattern),
                )
            )

        if location:
            query = query.where(Job.location.ilike(f"%{location}%"))

        if experience_level:
            query = query.where(Job.experience_level == experience_level)

        if job_type:
            query = query.where(Job.job_type == job_type)

        if is_remote is not None:
            query = query.where(Job.is_remote == is_remote)

        query = query.order_by(Job.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def list_by_employer(
        self, employer_profile_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[Job]:
        result = await self.db.execute(
            select(Job)
            .where(
                Job.employer_profile_id == employer_profile_id,
                Job.deleted_at.is_(None),
            )
            .options(selectinload(Job.skills), selectinload(Job.employer_profile))
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def list_by_employers(
        self, employer_profile_ids: list[uuid.UUID], skip: int = 0, limit: int = 20
    ) -> list[Job]:
        """List jobs for multiple employer profiles (e.g. all users from same company domain)."""
        if not employer_profile_ids:
            return []
        result = await self.db.execute(
            select(Job)
            .where(
                Job.employer_profile_id.in_(employer_profile_ids),
                Job.deleted_at.is_(None),
            )
            .options(selectinload(Job.skills), selectinload(Job.employer_profile))
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def update(
        self, job_id: uuid.UUID, employer_profile_id: uuid.UUID, payload: JobUpdate
    ) -> Job:
        job = await self.get_by_id(job_id)
        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )
        if job.employer_profile_id != employer_profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own jobs",
            )

        update_data = payload.model_dump(exclude_unset=True, exclude={"skill_ids"})
        for field, value in update_data.items():
            setattr(job, field, value)

        # Reassociate skills if provided
        if payload.skill_ids is not None:
            result = await self.db.execute(
                select(Skill).where(Skill.id.in_(payload.skill_ids))
            )
            job.skills = list(result.scalars().all())

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def delete(self, job_id: uuid.UUID, employer_profile_id: uuid.UUID) -> None:
        """Soft-delete by archiving."""
        from datetime import datetime, timezone

        job = await self.get_by_id(job_id)
        if job is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )
        if job.employer_profile_id != employer_profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own jobs",
            )
        job.status = JobStatus.ARCHIVED
        job.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def get_recommended_jobs(self, seeker_id: uuid.UUID) -> list[Job]:
        """Get automated deterministic job recommendations based on skills."""
        from app.models.profile import SeekerProfile
        
        # 1. Fetch seeker skills
        result = await self.db.execute(
            select(SeekerProfile)
            .where(SeekerProfile.user_id == seeker_id)
            .options(selectinload(SeekerProfile.skills))
        )
        seeker = result.scalar_one_or_none()
        if not seeker:
            return []
            
        seeker_skill_ids = {skill.id for skill in seeker.skills}
        if not seeker_skill_ids:
            return []
            
        # 2. Query open jobs
        result = await self.db.execute(
            select(Job)
            .where(Job.status == JobStatus.OPEN, Job.deleted_at.is_(None))
            .options(selectinload(Job.skills), selectinload(Job.employer_profile))
        )
        jobs = list(result.scalars().unique().all())
        
        # 3. Calculate score
        job_scores = []
        for job in jobs:
            job_skill_ids = {skill.id for skill in job.skills}
            if not job_skill_ids:
                continue
                
            matched = len(seeker_skill_ids.intersection(job_skill_ids))
            score = (matched / len(job_skill_ids)) * 100
            if score > 0:
                job_scores.append((job, score))
                
        # 4. Sort descending and get top 10
        job_scores.sort(key=lambda x: x[1], reverse=True)
        return [job for job, _ in job_scores[:10]]
