"""AI schemas — request/response models for Gemini-powered features."""

import uuid
from typing import Optional

from pydantic import BaseModel, Field


# ── Job Description Generator ────────────────────────────────────────


class JobDescriptionRequest(BaseModel):
    title: str
    skills: list[str] = []
    experience_level: str | None = None  # junior / mid / senior
    job_type: str | None = None  # full_time / part_time / contract / internship
    company_description: str | None = None


class JobDescriptionOutput(BaseModel):
    title: str = Field(description="Job title")
    summary: str = Field(description="2-3 sentence overview of the role")
    responsibilities: list[str] = Field(description="Key responsibilities")
    requirements: list[str] = Field(description="Must-have requirements")
    nice_to_have: list[str] = Field(description="Nice-to-have qualifications")
    benefits: list[str] = Field(description="Benefits and perks")


# ── Resume Match ─────────────────────────────────────────────────────


class ResumeMatchRequest(BaseModel):
    application_id: uuid.UUID


class ResumeMatchOutput(BaseModel):
    match_score: int = Field(ge=0, le=100, description="0-100 match score")
    strengths: list[str] = Field(description="Resume strengths for this role")
    gaps: list[str] = Field(description="Gaps or missing qualifications")
    overall_assessment: str = Field(description="Summary assessment")


# ── Resume Review ────────────────────────────────────────────────────


class ResumeReviewRequest(BaseModel):
    resume_text: str


class ResumeReviewOutput(BaseModel):
    overall_rating: str = Field(description="strong / moderate / weak")
    strengths: list[str] = Field(description="Resume strengths")
    improvements: list[str] = Field(description="Areas to improve")
    formatting_suggestions: list[str] = Field(description="Formatting tips")
    summary: str = Field(description="Overall summary")


# ── Profile Optimization ─────────────────────────────────────────────


class ProfileOptimizationOutput(BaseModel):
    completeness_score: int = Field(ge=0, le=100, description="Profile completeness 0-100")
    missing_fields: list[str] = Field(description="Missing or empty fields")
    improvement_suggestions: list[str] = Field(description="Actionable suggestions")
    headline_suggestion: str = Field(description="Suggested professional headline")
    summary_suggestion: str = Field(description="Suggested profile summary")

# ── AI Job Recommendations ───────────────────────────────────────────


class AIJobRecommendation(BaseModel):
    job_id: str = Field(description="UUID of the matched job")
    job_title: str = Field(description="Title of the job")
    company_name: str = Field(description="Company that posted the job")
    match_score: int = Field(ge=0, le=100, description="0-100 match score")
    strengths: list[str] = Field(description="Resume strengths for this role")
    gaps: list[str] = Field(description="Gaps or missing qualifications")
    summary: str = Field(description="Brief assessment summary")


class AIRecommendationsOutput(BaseModel):
    recommendations: list[AIJobRecommendation] = Field(
        description="Ranked list of job recommendations with scores"
    )


class ApplicationScoreRequest(BaseModel):
    job_id: uuid.UUID


# ── Resume Extraction ────────────────────────────────────────────────

class AIExperience(BaseModel):
    title: str
    company_name: str
    start_date: str = Field(description="YYYY-MM-DD or YYYY-MM")
    end_date: str | None = Field(None, description="YYYY-MM-DD or YYYY-MM, or null if current")
    is_current: bool
    description: str | None

class AIEducation(BaseModel):
    institution: str
    degree: str | None
    field_of_study: str | None
    start_year: int | None
    end_year: int | None

class AILanguage(BaseModel):
    name: str = Field(description="Only spoken/written human languages like English, Spanish, etc. Strictly NO programming languages, frameworks, or tools (e.g. Python, React).")
    proficiency: str | None

class AIProject(BaseModel):
    name: str
    description: str | None
    role: str | None
    url: str | None
    start_date: str | None = Field(None, description="YYYY-MM-DD or YYYY-MM")
    end_date: str | None = Field(None, description="YYYY-MM-DD or YYYY-MM, or null if current")
    is_current: bool

class ResumeExtractionOutput(BaseModel):
    full_name: str | None
    headline: str | None
    location: str | None
    about: str | None
    experiences: list[AIExperience] = Field(default_factory=list)
    education_entries: list[AIEducation] = Field(default_factory=list)
    languages: list[AILanguage] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list, description="Distinct technical skills, tools, methodologies, and framework keywords extracted from the resume. Only put technical skills here.")
    projects: list[AIProject] = Field(default_factory=list)
