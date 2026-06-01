"""AI router — Gemini-powered generation endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, require_role
from app.db.enums import JobStatus, UserRole
from app.db.session import get_db_session
from app.models.application import Application
from app.models.job import Job
from app.models.profile import SeekerProfile
from app.models.user import User
from app.schemas.ai import (
    AIRecommendationsOutput,
    JobDescriptionOutput,
    JobDescriptionRequest,
    ProfileOptimizationOutput,
    ResumeMatchOutput,
    ResumeMatchRequest,
    ResumeReviewOutput,
    ResumeReviewRequest,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])

_ai = AIService()


@router.post("/job-description", response_model=JobDescriptionOutput)
async def generate_job_description(
    payload: JobDescriptionRequest,
    user: Annotated[User, Depends(require_role(UserRole.EMPLOYER, UserRole.ADMIN))],
):
    """Employer generates a job description using AI."""
    return await _ai.generate_job_description(
        title=payload.title,
        skills=payload.skills,
        experience_level=payload.experience_level,
        job_type=payload.job_type,
        company_description=payload.company_description,
    )


@router.post("/resume-match/{application_id}", response_model=ResumeMatchOutput)
async def resume_match(
    application_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Manual trigger: compute AI match score between resume and job."""
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.job))
    )
    app = result.scalar_one_or_none()
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    # Only the applicant or the job owner can trigger
    if app.seeker_id != user.id:
        job_result = await db.execute(
            select(Job)
            .where(Job.id == app.job_id)
            .options(selectinload(Job.employer_profile))
        )
        job = job_result.scalar_one_or_none()
        if job is None or job.employer_profile.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to trigger match for this application",
            )

    # Get the seeker's profile to parse their resume data
    profile_result = await db.execute(
        select(SeekerProfile).where(SeekerProfile.user_id == app.seeker_id)
    )
    profile = profile_result.scalar_one_or_none()

    import json
    resume_content = ""
    if profile and profile.parsed_resume_data:
        resume_content = json.dumps(profile.parsed_resume_data, indent=2, default=str)
    
    # Build resume text from cover letter and parsed profile resume
    resume_text = ""
    if app.cover_letter:
        resume_text += f"Cover Letter:\n{app.cover_letter}\n\n"
    if resume_content:
        resume_text += f"Resume Data:\n{resume_content}"

    if not resume_text.strip():
        resume_text = "(No resume text available)"

    job_description = app.job.description if app.job else "(No job description)"

    match_result = await _ai.calculate_resume_match(resume_text, job_description)

    # Persist to DB
    app.ai_match_score = match_result.match_score
    app.ai_review_text = match_result.overall_assessment
    await db.commit()

    return match_result


@router.post("/resume-review", response_model=ResumeReviewOutput)
async def resume_review(
    payload: ResumeReviewRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    """Seeker triggers AI review of their resume text."""
    return await _ai.generate_resume_review(payload.resume_text)


@router.post("/profile-optimize", response_model=ProfileOptimizationOutput)
async def profile_optimize(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Seeker triggers AI profile optimization analysis."""
    result = await db.execute(
        select(SeekerProfile).where(SeekerProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    profile_data = {
        "email": user.email,
        "role": user.role.value,
    }
    if profile:
        profile_data.update(
            {
                "full_name": profile.full_name,
                "headline": profile.headline,
                "summary": profile.summary,
                "location": profile.location,
                "phone": profile.phone,
                "website": profile.website,
                "linkedin_url": profile.linkedin_url,
                "github_url": profile.github_url,
            }
        )

    return await _ai.generate_profile_optimization(profile_data)


# ── AI Job Recommendations ───────────────────────────────────────────


@router.get(
    "/job-recommendations",
    response_model=AIRecommendationsOutput,
    summary="Get AI-scored job recommendations (seeker only)",
)
async def get_ai_job_recommendations(
    user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Use the seeker's stored resume data and all open jobs to get AI scores."""
    import json

    # 1. Get seeker profile with parsed resume data
    result = await db.execute(
        select(SeekerProfile).where(SeekerProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None or not profile.parsed_resume_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload your resume before using AI recommendations",
        )

    # 2. Serialize parsed resume data to text for Gemini
    resume_text = json.dumps(profile.parsed_resume_data, indent=2, default=str)

    # 3. Fetch all open jobs
    jobs_result = await db.execute(
        select(Job)
        .where(Job.status == JobStatus.OPEN, Job.deleted_at.is_(None))
        .options(selectinload(Job.skills), selectinload(Job.employer_profile))
        .limit(50)  # cap to avoid Gemini context overflow
    )
    jobs = list(jobs_result.scalars().unique().all())
    if not jobs:
        return AIRecommendationsOutput(recommendations=[])

    # 4. Build jobs context string
    jobs_lines = []
    for job in jobs:
        company = (
            job.employer_profile.company_name
            if job.employer_profile
            else "Unknown Company"
        )
        desc = (job.description or "No description")[:500]  # truncate long JDs
        jobs_lines.append(
            f"- **Job ID**: {job.id}\n"
            f"  **Title**: {job.title}\n"
            f"  **Company**: {company}\n"
            f"  **Description**: {desc}\n"
        )
    jobs_context = "\n".join(jobs_lines)

    # 5. Call Gemini with resume text (not PDF)
    return await _ai.get_ai_job_recommendations(resume_text, jobs_context)


# ── Application Resume Score ─────────────────────────────────────────


@router.post(
    "/application-score",
    response_model=ResumeMatchOutput,
    summary="Score an uploaded resume against a specific job (seeker only)",
)
async def score_application_resume(
    user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    job_id: uuid.UUID = Form(...),
    resume: UploadFile = File(...),
):
    """Upload a resume PDF and get AI score against a job description."""
    # 1. Validate file type
    if resume.content_type not in ("application/pdf",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    # 2. Read file bytes
    resume_bytes = await resume.read()
    if len(resume_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Resume file is too large (max 10 MB)",
        )

    # 3. Get job description
    job_result = await db.execute(
        select(Job).where(Job.id == job_id, Job.deleted_at.is_(None))
    )
    job = job_result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    job_description = job.description or "(No job description)"

    # 4. Score with Gemini
    return await _ai.score_resume_against_job(resume_bytes, job_description)

