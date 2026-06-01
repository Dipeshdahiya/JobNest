"""Job and Skill schemas."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator

from app.db.enums import ExperienceLevel, JobStatus, JobType


# ── Skill ────────────────────────────────────────────────────────────


class SkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


# ── Job ──────────────────────────────────────────────────────────────


class JobBase(BaseModel):
    title: str
    description: str | None = None  # Job description
    requirements: str | None = None
    what_to_expect: str | None = None
    additional_benefits: str | None = None
    location: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    experience_level: ExperienceLevel
    job_type: JobType
    is_remote: bool = False
    openings: int | None = None


class JobCreate(JobBase):
    skill_ids: list[uuid.UUID] = []


class JobRead(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employer_profile_id: uuid.UUID
    # Derived helpers for frontend display
    company_name: str | None = None
    employer_user_id: uuid.UUID | None = None
    status: JobStatus
    views_count: int = 0
    applications_count: int = 0
    skills: list[SkillRead] = []
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _extract_company_name(cls, data: Any) -> Any:
        # When constructed from an ORM model, pull company_name and employer_user_id
        # from the EmployerProfile relationship for convenience on the frontend.
        if not isinstance(data, dict):
            ep = getattr(data, "employer_profile", None)
            if ep is not None:
                cn = getattr(ep, "company_name", None)
                if cn:
                    object.__setattr__(data, "company_name", cn)
                uid = getattr(ep, "user_id", None)
                if uid:
                    object.__setattr__(data, "employer_user_id", uid)
        return data



class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    what_to_expect: str | None = None
    additional_benefits: str | None = None
    location: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    experience_level: ExperienceLevel | None = None
    job_type: JobType | None = None
    is_remote: bool | None = None
    openings: int | None = None
    status: JobStatus | None = None
    skill_ids: list[uuid.UUID] | None = None
