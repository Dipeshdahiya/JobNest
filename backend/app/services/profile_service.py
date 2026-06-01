"""Profile service — Seeker and Employer profile management."""

import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select, update as sa_update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import (
    EmployerProfile,
    SeekerProfile,
    Experience,
    EducationEntry,
    Language,
    Project,
)
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.db.enums import ApplicationStatus
from app.schemas.profile import (
    EmployerProfileCreate,
    EmployerProfileUpdate,
    ExperienceCreate,
    ExperienceUpdate,
    EducationEntryCreate,
    EducationEntryUpdate,
    LanguageCreate,
    LanguageUpdate,
    ProjectCreate,
    ProjectUpdate,
    SeekerProfileCreate,
    SeekerProfileUpdate,
    EmployerStats,
    TimeBucket,
)


class ProfileService:
    """Manage seeker and employer profiles."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Seeker ───────────────────────────────────────────────────────

    async def get_seeker_profile(self, user_id: uuid.UUID) -> SeekerProfile | None:
        result = await self.db.execute(
            select(SeekerProfile)
            .where(SeekerProfile.user_id == user_id)
            .options(
                selectinload(SeekerProfile.experiences),
                selectinload(SeekerProfile.education_entries),
                selectinload(SeekerProfile.skills),
                selectinload(SeekerProfile.certifications),
                selectinload(SeekerProfile.languages),
            )
        )
        return result.scalar_one_or_none()

    async def get_seeker_profile_by_id(
        self, profile_id: uuid.UUID
    ) -> SeekerProfile | None:
        result = await self.db.execute(
            select(SeekerProfile)
            .where(SeekerProfile.id == profile_id)
            .options(
                selectinload(SeekerProfile.experiences),
                selectinload(SeekerProfile.education_entries),
                selectinload(SeekerProfile.skills),
                selectinload(SeekerProfile.certifications),
                selectinload(SeekerProfile.languages),
            )
        )
        return result.scalar_one_or_none()

    async def create_seeker_profile(
        self, user_id: uuid.UUID, payload: SeekerProfileCreate
    ) -> SeekerProfile:
        # Check if profile already exists
        existing = await self.get_seeker_profile(user_id)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seeker profile already exists",
            )

        profile = SeekerProfile(
            user_id=user_id,
            **payload.model_dump(),
        )
        self.db.add(profile)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def update_seeker_profile(
        self, user_id: uuid.UUID, payload: SeekerProfileUpdate
    ) -> SeekerProfile:
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def increment_profile_views(self, profile_id: uuid.UUID) -> None:
        await self.db.execute(
            sa_update(SeekerProfile)
            .where(SeekerProfile.id == profile_id)
            .values(profile_views_count=SeekerProfile.profile_views_count + 1)
            .execution_options(synchronize_session=False)
        )
        await self.db.flush()

    async def increment_resume_views(self, profile_id: uuid.UUID) -> None:
        await self.db.execute(
            sa_update(SeekerProfile)
            .where(SeekerProfile.id == profile_id)
            .values(resume_views_count=SeekerProfile.resume_views_count + 1)
            .execution_options(synchronize_session=False)
        )
        await self.db.flush()

    # ── Employer helpers ─────────────────────────────────────────────

    async def get_employer_profiles_by_domain(
        self, domain: str
    ) -> list[EmployerProfile]:
        """Return all employer profiles where the owning user's email matches the given domain."""
        pattern = f"%@{domain}"
        result = await self.db.execute(
            select(EmployerProfile)
            .join(User, User.id == EmployerProfile.user_id)
            .where(User.email.ilike(pattern))
            .options(selectinload(EmployerProfile.jobs))
        )
        return list(result.scalars().unique().all())

    async def get_company_profile_by_domain(self, domain: str) -> EmployerProfile | None:
        """Return the canonical company profile for a domain (oldest created employer profile)."""
        pattern = f"%@{domain}"
        result = await self.db.execute(
            select(EmployerProfile)
            .join(User, User.id == EmployerProfile.user_id)
            .where(User.email.ilike(pattern))
            .order_by(EmployerProfile.created_at.asc())
            .limit(1)
            .options(selectinload(EmployerProfile.jobs))
        )
        return result.scalar_one_or_none()

    async def sync_skills(
        self, user_id: uuid.UUID, skill_names: list[str]
    ) -> SeekerProfile:
        from app.models.job import Skill
        
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )
            
        if not skill_names:
            profile.skills.clear()
            await self.db.flush()
            await self.db.refresh(profile)
            return profile

        # Normalize names to title case
        normalized_names = list({s.strip().title() for s in skill_names if s.strip()})
        
        # Find existing skills
        existing_skills_result = await self.db.execute(
            select(Skill).where(Skill.name.in_(normalized_names))
        )
        existing_skills = list(existing_skills_result.scalars().all())
        existing_names = {s.name for s in existing_skills}
        
        # Create missing skills
        new_skills = [
            Skill(name=n) for n in normalized_names if n not in existing_names
        ]
        if new_skills:
            self.db.add_all(new_skills)
            await self.db.flush()
        
        # Replace profile skills
        profile.skills = existing_skills + new_skills
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    # ── Experience / Education / Language CRUD ────────────────────────

    async def add_experience(
        self, user_id: uuid.UUID, payload: ExperienceCreate
    ) -> SeekerProfile:
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )
        exp = Experience(seeker_profile_id=profile.id, **payload.model_dump())
        self.db.add(exp)
        await self.db.flush()
        return await self.get_seeker_profile(user_id)

    async def delete_experience(
        self, user_id: uuid.UUID, experience_id: uuid.UUID
    ) -> SeekerProfile:
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )
        exp = next((e for e in profile.experiences if e.id == experience_id), None)
        if exp is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Experience not found",
            )
        await self.db.delete(exp)
        await self.db.flush()
        return await self.get_seeker_profile(user_id)

    async def add_education(
        self, user_id: uuid.UUID, payload: EducationEntryCreate
    ) -> SeekerProfile:
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )
        edu = EducationEntry(seeker_profile_id=profile.id, **payload.model_dump())
        self.db.add(edu)
        await self.db.flush()
        return await self.get_seeker_profile(user_id)

    async def delete_education(
        self, user_id: uuid.UUID, education_id: uuid.UUID
    ) -> SeekerProfile:
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )
        edu = next((e for e in profile.education_entries if e.id == education_id), None)
        if edu is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Education entry not found",
            )
        await self.db.delete(edu)
        await self.db.flush()
        return await self.get_seeker_profile(user_id)

    async def add_language(
        self, user_id: uuid.UUID, payload: LanguageCreate
    ) -> SeekerProfile:
        profile = await self.get_seeker_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seeker profile not found",
            )
        lang = Language(seeker_profile_id=profile.id, **payload.model_dump())
        self.db.add(lang)
        await self.db.flush()
        return await self.get_seeker_profile(user_id)

    async def delete_language(
        self, user_id: uuid.UUID, language_id: uuid.UUID
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        for lang in profile.languages:
            if lang.id == language_id:
                await self.db.delete(lang)
                await self.db.flush()
                await self.db.refresh(profile)
                return profile

        raise HTTPException(status_code=404, detail="Language not found")

    async def update_experience(
        self, user_id: uuid.UUID, experience_id: uuid.UUID, payload: ExperienceUpdate
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        for exp in profile.experiences:
            if exp.id == experience_id:
                for k, v in payload.model_dump(exclude_unset=True).items():
                    setattr(exp, k, v)
                await self.db.flush()
                await self.db.refresh(profile)
                return profile
        raise HTTPException(status_code=404, detail="Experience not found")

    async def update_education(
        self, user_id: uuid.UUID, education_id: uuid.UUID, payload: EducationEntryUpdate
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        for edu in profile.education_entries:
            if edu.id == education_id:
                for k, v in payload.model_dump(exclude_unset=True).items():
                    setattr(edu, k, v)
                await self.db.flush()
                await self.db.refresh(profile)
                return profile
        raise HTTPException(status_code=404, detail="Education entry not found")

    async def update_language(
        self, user_id: uuid.UUID, language_id: uuid.UUID, payload: LanguageUpdate
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        for lang in profile.languages:
            if lang.id == language_id:
                for k, v in payload.model_dump(exclude_unset=True).items():
                    setattr(lang, k, v)
                await self.db.flush()
                await self.db.refresh(profile)
                return profile
        raise HTTPException(status_code=404, detail="Language not found")

    # ── Project CRUD ──────────────────────────────────────────────────

    async def add_project(
        self, user_id: uuid.UUID, payload: ProjectCreate
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        proj = Project(seeker_profile_id=profile.id, **payload.model_dump())
        self.db.add(proj)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def update_project(
        self, user_id: uuid.UUID, project_id: uuid.UUID, payload: ProjectUpdate
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        for proj in profile.projects:
            if proj.id == project_id:
                for k, v in payload.model_dump(exclude_unset=True).items():
                    setattr(proj, k, v)
                await self.db.flush()
                await self.db.refresh(profile)
                return profile
        raise HTTPException(status_code=404, detail="Project not found")

    async def delete_project(
        self, user_id: uuid.UUID, project_id: uuid.UUID
    ):
        profile = await self.get_seeker_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        for proj in profile.projects:
            if proj.id == project_id:
                await self.db.delete(proj)
                await self.db.flush()
                await self.db.refresh(profile)
                return profile

        raise HTTPException(status_code=404, detail="Project not found")

    # ── Employer ─────────────────────────────────────────────────────

    async def get_employer_profile(
        self, user_id: uuid.UUID
    ) -> EmployerProfile | None:
        result = await self.db.execute(
            select(EmployerProfile)
            .where(EmployerProfile.user_id == user_id)
            .options(selectinload(EmployerProfile.jobs))
        )
        return result.scalar_one_or_none()

    async def get_employer_profile_by_id(
        self, profile_id: uuid.UUID
    ) -> EmployerProfile | None:
        result = await self.db.execute(
            select(EmployerProfile)
            .where(EmployerProfile.id == profile_id)
            .options(selectinload(EmployerProfile.jobs))
        )
        return result.scalar_one_or_none()

    async def create_employer_profile(
        self, user_id: uuid.UUID, payload: EmployerProfileCreate
    ) -> EmployerProfile:
        existing = await self.get_employer_profile(user_id)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employer profile already exists",
            )

        profile = EmployerProfile(
            user_id=user_id,
            **payload.model_dump(),
        )
        self.db.add(profile)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def update_employer_profile(
        self, user_id: uuid.UUID, payload: EmployerProfileUpdate
    ) -> EmployerProfile:
        profile = await self.get_employer_profile(user_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employer profile not found",
            )

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def get_employer_stats(self, employer_profile_id: uuid.UUID) -> EmployerStats:
        """Aggregate basic analytics for a single employer profile."""
        # Total jobs
        total_jobs_result = await self.db.execute(
            select(func.count())
            .select_from(Job)
            .where(Job.employer_profile_id == employer_profile_id, Job.deleted_at.is_(None))
        )
        total_jobs = int(total_jobs_result.scalar_one() or 0)

        # Total hires (applications with OFFER status)
        hires_result = await self.db.execute(
            select(func.count())
            .select_from(Application)
            .join(Job, Application.job_id == Job.id)
            .where(
                Job.employer_profile_id == employer_profile_id,
                Job.deleted_at.is_(None),
                Application.status == ApplicationStatus.OFFER,
            )
        )
        total_hires = int(hires_result.scalar_one() or 0)

        # Jobs posted per month
        jobs_pm_result = await self.db.execute(
            select(
                func.date_trunc("month", Job.created_at).label("period"),
                func.count().label("count"),
            )
            .where(Job.employer_profile_id == employer_profile_id, Job.deleted_at.is_(None))
            .group_by("period")
            .order_by("period")
        )
        jobs_per_month: list[TimeBucket] = []
        for row in jobs_pm_result:
            period = row.period
            if hasattr(period, "date"):
                period = period.date()
            jobs_per_month.append(TimeBucket(period=period, count=int(row.count)))

        # Hires per month
        hires_pm_result = await self.db.execute(
            select(
                func.date_trunc("month", Application.created_at).label("period"),
                func.count().label("count"),
            )
            .join(Job, Application.job_id == Job.id)
            .where(
                Job.employer_profile_id == employer_profile_id,
                Job.deleted_at.is_(None),
                Application.status == ApplicationStatus.OFFER,
            )
            .group_by("period")
            .order_by("period")
        )
        hires_per_month: list[TimeBucket] = []
        for row in hires_pm_result:
            period = row.period
            if hasattr(period, "date"):
                period = period.date()
            hires_per_month.append(TimeBucket(period=period, count=int(row.count)))

        return EmployerStats(
            total_jobs=total_jobs,
            total_hires=total_hires,
            jobs_per_month=jobs_per_month,
            hires_per_month=hires_per_month,
        )
