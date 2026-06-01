"""Profiles router — seeker and employer profiles, resume upload."""

import uuid
from typing import Annotated
import logging
import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.enums import UserRole
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.profile import (
    EmployerProfileCreate,
    EmployerProfileRead,
    EmployerProfileUpdate,
    EmployerStats,
    ExperienceCreate,
    EducationEntryCreate,
    LanguageCreate,
    SeekerProfileCreate,
    SeekerProfileRead,
    SeekerProfileUpdate,
)
from app.services.cloudinary_service import CloudinaryService
from app.services.profile_service import ProfileService
from app.utils.constants import CLOUDINARY_RESUME_FOLDER, MAX_UPLOAD_SIZE_BYTES

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def _profile_service(db: AsyncSession = Depends(get_db_session)) -> ProfileService:
    return ProfileService(db)


def _cloudinary_service() -> CloudinaryService:
    return CloudinaryService()


# ── Seeker Endpoints ────────────────────────────────────────────────


@router.get(
    "/seeker/me",
    response_model=SeekerProfileRead,
    summary="Get own seeker profile",
)
async def get_my_seeker_profile(
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    profile = await svc.get_seeker_profile(current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seeker profile not found. Create one first.",
        )
    return profile


@router.post(
    "/seeker",
    response_model=SeekerProfileRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create seeker profile",
)
async def create_seeker_profile(
    payload: SeekerProfileCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.create_seeker_profile(current_user.id, payload)


@router.patch(
    "/seeker",
    response_model=SeekerProfileRead,
    summary="Update seeker profile",
)
async def update_seeker_profile(
    payload: SeekerProfileUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.update_seeker_profile(current_user.id, payload)


@router.get(
    "/seeker/{user_id}",
    response_model=SeekerProfileRead,
    summary="View public seeker profile by user ID",
)
async def get_public_seeker_profile(
    user_id: uuid.UUID,
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    profile = await svc.get_seeker_profile(user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    # Increment view counter (analytics)
    await svc.increment_profile_views(profile.id)
    return profile


# ── Resume Upload ───────────────────────────────────────────────────


@router.post(
    "/seeker/resume",
    response_model=SeekerProfileRead,
    summary="Upload or replace resume (PDF only, max 10MB)",
)
async def upload_resume(
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
    cloud: Annotated[CloudinaryService, Depends(_cloudinary_service)],
    file: UploadFile = File(...),
    prefill_profile: bool = Form(False),
):
    # Validate content type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    # Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB",
        )

    profile = await svc.get_seeker_profile(current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create a seeker profile before uploading a resume",
        )

    # Delete old resume from Cloudinary if exists
    if profile.resume_url:
        try:
            # Extract public_id from the URL
            old_public_id = profile.resume_url.split("/upload/")[-1]
            # Remove version prefix if present (e.g., v1234567/)
            if old_public_id.startswith("v") and "/" in old_public_id:
                old_public_id = old_public_id.split("/", 1)[1]
            await cloud.delete_file(old_public_id)
        except Exception:
            pass  # Best-effort deletion of old file

    # Upload new resume
    result = await cloud.upload_file(
        file_bytes,
        folder=CLOUDINARY_RESUME_FOLDER,
        public_id=f"resume_{current_user.id}.pdf",
        overwrite=True,
    )

    # Update profile with new resume URL
    profile.resume_url = result["secure_url"]

    # Extract resume data using Gemini AI
    try:
        from app.services.ai_service import AIService
        ai_service = AIService()
        extracted_data = await ai_service.extract_resume_data(file_bytes)
        
        # Save exact snapshot onto profile
        profile.parsed_resume_data = extracted_data.model_dump()
        
        if prefill_profile:
            # Merge basic fields if empty
            if extracted_data.full_name and not profile.full_name:
                profile.full_name = extracted_data.full_name
            elif extracted_data.full_name and "@" in profile.full_name:
                profile.full_name = extracted_data.full_name
                
            if extracted_data.headline and not profile.headline:
                profile.headline = extracted_data.headline
            if extracted_data.location and not profile.location:
                profile.location = extracted_data.location
            if extracted_data.about and not profile.about:
                profile.about = extracted_data.about
                
            # Parse dates Helper
            def _parse_date(d_str: str | None) -> date | None:
                if not d_str:
                    return None
                m = re.match(r"^(\d{4})(?:-(\d{2}))?", d_str)
                if m:
                    year = int(m.group(1))
                    month = int(m.group(2)) if m.group(2) else 1
                    return date(year, month, 1)
                return None
                
            # Add experiences
            if extracted_data.experiences:
                # We overwrite existing to avoid duplicates when user re-uploads and checks prefill
                for exp in list(profile.experiences):
                    await svc.db.delete(exp)
                profile.experiences.clear()
                
                from app.models.profile import Experience
                for exp_data in extracted_data.experiences:
                    start_d = _parse_date(exp_data.start_date) or date.today()
                    end_d = _parse_date(exp_data.end_date)
                    
                    new_exp = Experience(
                        seeker_profile_id=profile.id,
                        title=exp_data.title,
                        company_name=exp_data.company_name,
                        start_date=start_d,
                        end_date=end_d,
                        is_current=exp_data.is_current,
                        description=exp_data.description
                    )
                    profile.experiences.append(new_exp)
                    
            # Add education
            if extracted_data.education_entries:
                for edu in list(profile.education_entries):
                    await svc.db.delete(edu)
                profile.education_entries.clear()
                
                from app.models.profile import EducationEntry
                for edu_data in extracted_data.education_entries:
                    new_edu = EducationEntry(
                        seeker_profile_id=profile.id,
                        institution=edu_data.institution,
                        degree=edu_data.degree,
                        field_of_study=edu_data.field_of_study,
                        start_year=edu_data.start_year,
                        end_year=edu_data.end_year
                    )
                    profile.education_entries.append(new_edu)
                    
            # Add languages
            if extracted_data.languages:
                for lang in list(profile.languages):
                    await svc.db.delete(lang)
                profile.languages.clear()
                
                from app.models.profile import Language
                for lang_data in extracted_data.languages:
                    new_lang = Language(
                        seeker_profile_id=profile.id,
                        name=lang_data.name,
                        proficiency=lang_data.proficiency
                    )
                    profile.languages.append(new_lang)

            # Add projects
            if getattr(extracted_data, "projects", None):
                for proj in list(profile.projects):
                    await svc.db.delete(proj)
                profile.projects.clear()
                
                from app.models.profile import Project
                for proj_data in extracted_data.projects:
                    start_d = _parse_date(proj_data.start_date)
                    end_d = _parse_date(proj_data.end_date)
                    
                    new_proj = Project(
                        seeker_profile_id=profile.id,
                        name=proj_data.name,
                        description=proj_data.description,
                        role=proj_data.role,
                        url=proj_data.url,
                        start_date=start_d,
                        end_date=end_d,
                        is_current=proj_data.is_current
                    )
                    profile.projects.append(new_proj)
            # Add skills
            if getattr(extracted_data, "skills", None):
                profile = await svc.sync_skills(user_id=profile.user_id, skill_names=extracted_data.skills)

    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to extract resume data via AI: {e}")

    await svc.db.flush()
    await svc.db.refresh(profile)
    return profile


@router.post(
    "/seeker/photo",
    response_model=SeekerProfileRead,
    summary="Upload seeker profile photo",
)
async def upload_seeker_photo(
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
    cloud: Annotated[CloudinaryService, Depends(_cloudinary_service)],
    file: UploadFile = File(...),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
         raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB",
        )

    profile = await svc.get_seeker_profile(current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create a seeker profile before uploading a photo",
        )

    if profile.profile_photo_url:
        try:
            old_public_id = profile.profile_photo_url.split("/upload/")[-1]
            if old_public_id.startswith("v") and "/" in old_public_id:
                old_public_id = old_public_id.split("/", 1)[1]
            await cloud.delete_file(old_public_id)
        except Exception:
            pass

    result = await cloud.upload_file(
        file_bytes,
        folder="career_canvas/avatars",
        public_id=f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}",
        overwrite=True,
    )

    profile.profile_photo_url = result["secure_url"]
    await svc.db.flush()
    await svc.db.refresh(profile)
    return profile

@router.put(
    "/seeker/skills",
    response_model=SeekerProfileRead,
    summary="Sync seeker skills",
)
async def sync_seeker_skills(
    skills: list[str],
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.sync_skills(current_user.id, skills)


# ── Experience / Education / Language CRUD ────────────────────────


@router.post(
    "/seeker/experiences",
    response_model=SeekerProfileRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add an experience entry",
)
async def add_experience(
    payload: ExperienceCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.add_experience(current_user.id, payload)


@router.delete(
    "/seeker/experiences/{experience_id}",
    response_model=SeekerProfileRead,
    summary="Delete an experience entry",
)
async def delete_experience(
    experience_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.delete_experience(current_user.id, experience_id)


@router.post(
    "/seeker/education",
    response_model=SeekerProfileRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add an education entry",
)
async def add_education(
    payload: EducationEntryCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.add_education(current_user.id, payload)


@router.delete(
    "/seeker/education/{education_id}",
    response_model=SeekerProfileRead,
    summary="Delete an education entry",
)
async def delete_education(
    education_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.delete_education(current_user.id, education_id)


@router.post(
    "/seeker/languages",
    response_model=SeekerProfileRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a language",
)
async def add_language(
    payload: LanguageCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.add_language(current_user.id, payload)


@router.delete(
    "/seeker/languages/{language_id}",
    response_model=SeekerProfileRead,
    summary="Delete a language",
)
async def delete_language(
    language_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.delete_language(current_user.id, language_id)

from app.schemas.profile import ExperienceUpdate, EducationEntryUpdate, LanguageUpdate

@router.patch("/seeker/experience/{experience_id}", response_model=SeekerProfileRead)
async def update_experience(
    experience_id: uuid.UUID,
    payload: ExperienceUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.update_experience(current_user.id, experience_id, payload)


@router.patch("/seeker/education/{education_id}", response_model=SeekerProfileRead)
async def update_education(
    education_id: uuid.UUID,
    payload: EducationEntryUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.update_education(current_user.id, education_id, payload)

@router.patch("/seeker/language/{language_id}", response_model=SeekerProfileRead)
async def update_language(
    language_id: uuid.UUID,
    payload: LanguageUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.update_language(current_user.id, language_id, payload)

# ── Project CRUD ──────────────────────────────────────────────────

from app.schemas.profile import ProjectCreate, ProjectUpdate

@router.post("/seeker/project", response_model=SeekerProfileRead)
async def add_project(
    payload: ProjectCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.add_project(current_user.id, payload)

@router.patch("/seeker/project/{project_id}", response_model=SeekerProfileRead)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.update_project(current_user.id, project_id, payload)

@router.delete("/seeker/project/{project_id}", response_model=SeekerProfileRead)
async def delete_project(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.SEEKER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    return await svc.delete_project(current_user.id, project_id)


# ── Employer Endpoints ──────────────────────────────────────────────


@router.get(
    "/employer/me",
    response_model=EmployerProfileRead,
    summary="Get own employer profile",
)
async def get_my_employer_profile(
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    profile = await svc.get_employer_profile(current_user.id)
    if profile is None:
        # Fallback: shared company profile for same email domain
        domain = current_user.email.split("@")[-1].lower()
        profile = await svc.get_company_profile_by_domain(domain)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found. Create one first.",
        )
    return profile


@router.post(
    "/employer",
    response_model=EmployerProfileRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create employer profile",
)
async def create_employer_profile(
    payload: EmployerProfileCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    # Enforce one company profile per domain (single shared dashboard per company)
    domain = current_user.email.split("@")[-1].lower()
    existing = await svc.get_company_profile_by_domain(domain)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A company profile already exists for your company domain. Please use the existing company dashboard.",
        )
    return await svc.create_employer_profile(current_user.id, payload)


@router.patch(
    "/employer",
    response_model=EmployerProfileRead,
    summary="Update employer profile",
)
async def update_employer_profile(
    payload: EmployerProfileUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.EMPLOYER))],
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    # Allow editing only by the company admin (owner of the canonical company profile)
    domain = current_user.email.split("@")[-1].lower()
    company_profile = await svc.get_company_profile_by_domain(domain)
    if company_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found. Create one first.",
        )
    if company_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company admin can edit the company profile.",
        )
    return await svc.update_employer_profile(current_user.id, payload)


@router.get(
    "/employer/{user_id}",
    response_model=EmployerProfileRead,
    summary="View public employer/company profile by user ID",
)
async def get_public_employer_profile(
    user_id: uuid.UUID,
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    profile = await svc.get_employer_profile(user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile


@router.get(
    "/employer/{user_id}/stats",
    response_model=EmployerStats,
    summary="Get public employer stats (jobs and hires over time)",
)
async def get_public_employer_stats(
    user_id: uuid.UUID,
    svc: Annotated[ProfileService, Depends(_profile_service)],
):
    profile = await svc.get_employer_profile(user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return await svc.get_employer_stats(profile.id)
