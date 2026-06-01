"""Profile schemas — Seeker, Employer, and child entities."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.enums import ProfileVisibility
from app.schemas.job import SkillRead

# ── Experience ───────────────────────────────────────────────────────


class ExperienceBase(BaseModel):
    company_name: str
    title: str
    description: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool = False


class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    title: str | None = None
    company_name: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None

class ExperienceRead(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# ── Education ────────────────────────────────────────────────────────


class EducationEntryBase(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_year: int | None = None
    end_year: int | None = None


class EducationEntryCreate(EducationEntryBase):
    pass

class EducationEntryUpdate(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    start_year: int | None = None
    end_year: int | None = None

class EducationEntryRead(EducationEntryBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# ── Certification ────────────────────────────────────────────────────


class CertificationBase(BaseModel):
    name: str
    issuer: str | None = None
    issue_date: date | None = None


class CertificationCreate(CertificationBase):
    pass


class CertificationRead(CertificationBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# ── Language ─────────────────────────────────────────────────────────


class LanguageBase(BaseModel):
    name: str
    proficiency: str | None = None


class LanguageCreate(LanguageBase):
    pass

class LanguageUpdate(BaseModel):
    name: str | None = None
    proficiency: str | None = None


class LanguageRead(LanguageBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID

# ── Project ──────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    role: str | None = None
    url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    role: str | None = None
    url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None

class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID

# ── Seeker Profile ──────────────────────────────────────────────────


class SeekerProfileBase(BaseModel):
    full_name: str = Field(max_length=255)
    headline: str | None = None
    location: str | None = None
    about: str | None = None
    profile_visibility: ProfileVisibility = ProfileVisibility.PUBLIC


class SeekerProfileCreate(SeekerProfileBase):
    pass


class SeekerProfileRead(SeekerProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    profile_photo_url: str | None = None
    resume_url: str | None = None
    profile_views_count: int = 0
    resume_views_count: int = 0
    parsed_resume_data: dict | None = None
    experiences: list[ExperienceRead] = []
    education_entries: list[EducationEntryRead] = []
    certifications: list[CertificationRead] = []
    languages: list[LanguageRead] = []
    skills: list["SkillRead"] = []
    projects: list[ProjectRead] = []
    created_at: datetime
    updated_at: datetime


class SeekerProfileUpdate(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    location: str | None = None
    about: str | None = None
    profile_visibility: ProfileVisibility | None = None


# ── Employer Profile ────────────────────────────────────────────────


class EmployerProfileBase(BaseModel):
    company_name: str = Field(max_length=255)
    description: str | None = None
    website: str | None = None
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    headquarters: str | None = None
    employees_count: int | None = None
    founded_year: int | None = None


class EmployerProfileCreate(EmployerProfileBase):
    pass


class EmployerProfileRead(EmployerProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    logo_url: str | None = None
    cover_image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class EmployerProfileUpdate(BaseModel):
    company_name: str | None = None
    description: str | None = None
    website: str | None = None
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    headquarters: str | None = None
    employees_count: int | None = None
    founded_year: int | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None


class TimeBucket(BaseModel):
    period: date
    count: int


class EmployerStats(BaseModel):
    total_jobs: int
    total_hires: int
    jobs_per_month: list[TimeBucket] = []
    hires_per_month: list[TimeBucket] = []
