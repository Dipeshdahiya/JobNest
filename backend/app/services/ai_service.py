"""AI service — Gemini-powered generation and analysis.

All Gemini API interactions are centralised here so routers never
make direct AI calls.  Uses the new ``google-genai`` SDK with
structured output via Pydantic schemas.
"""

import json
import logging

from google.genai import types

from app.core.config import settings
from app.schemas.ai import (
    AIRecommendationsOutput,
    JobDescriptionOutput,
    ProfileOptimizationOutput,
    ResumeMatchOutput,
    ResumeReviewOutput,
)

logger = logging.getLogger(__name__)

# Late-initialised Gemini client (avoids import-time side effects).
_client = None


def _get_client():
    """Lazily initialise the google-genai Client."""
    global _client
    if _client is None:
        from google import genai

        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# Default model — use the latest non-deprecated flash model.
MODEL = "gemini-2.5-flash"


class AIService:
    """AI-powered content generation and analysis."""

    # ── Job Description Generator ────────────────────────────────────

    async def generate_job_description(
        self,
        title: str,
        skills: list[str] | None = None,
        experience_level: str | None = None,
        job_type: str | None = None,
        company_description: str | None = None,
    ) -> JobDescriptionOutput:
        """Generate a professional job description from a title and context."""
        context_parts = [f"Job Title: {title}"]
        if skills:
            context_parts.append(f"Required Skills: {', '.join(skills)}")
        if experience_level:
            context_parts.append(f"Experience Level: {experience_level}")
        if job_type:
            context_parts.append(f"Job Type: {job_type}")
        if company_description:
            context_parts.append(f"Company: {company_description}")

        user_prompt = "\n".join(context_parts)

        response = _get_client().models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert HR recruiter and technical writer. "
                    "Generate a professional, compelling, and detailed job "
                    "description given the title, skills, and context provided. "
                    "Be specific and realistic."
                ),
                response_mime_type="application/json",
                response_json_schema=JobDescriptionOutput.model_json_schema(),
            ),
        )

        return JobDescriptionOutput.model_validate_json(response.text)

    # ── Resume Match Score ───────────────────────────────────────────

    async def calculate_resume_match(
        self, resume_text: str, job_description: str
    ) -> ResumeMatchOutput:
        """Return a structured match analysis between resume and job description."""
        user_prompt = (
            "## Resume\n"
            f"{resume_text}\n\n"
            "## Job Description\n"
            f"{job_description}"
        )

        response = _get_client().models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert technical recruiter. Analyze how well "
                    "the provided resume matches the given job description. "
                    "Be objective, thorough, and fair. Provide a numeric score "
                    "from 0 to 100 and detailed feedback."
                ),
                response_mime_type="application/json",
                response_json_schema=ResumeMatchOutput.model_json_schema(),
            ),
        )

        return ResumeMatchOutput.model_validate_json(response.text)

    # ── Resume Review ────────────────────────────────────────────────

    async def generate_resume_review(self, resume_text: str) -> ResumeReviewOutput:
        """Provide actionable feedback on a resume."""
        response = _get_client().models.generate_content(
            model=MODEL,
            contents=f"Review this resume:\n\n{resume_text}",
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are a professional career coach and resume expert. "
                    "Analyze the provided resume for content quality, structure, "
                    "impact statements, and overall effectiveness. "
                    "Provide actionable, specific feedback."
                ),
                response_mime_type="application/json",
                response_json_schema=ResumeReviewOutput.model_json_schema(),
            ),
        )

        return ResumeReviewOutput.model_validate_json(response.text)

    # ── Profile Optimization Hints ───────────────────────────────────

    async def generate_profile_optimization(
        self, profile_data: dict
    ) -> ProfileOptimizationOutput:
        """Suggest improvements for a user's professional profile."""
        response = _get_client().models.generate_content(
            model=MODEL,
            contents=(
                "Analyze this professional profile and suggest improvements:\n\n"
                f"{json.dumps(profile_data, indent=2, default=str)}"
            ),
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are a LinkedIn profile optimization expert. "
                    "Analyze the user's profile data for completeness, "
                    "impact, and discoverability. Identify missing fields, "
                    "suggest improvements, and provide headline and summary "
                    "suggestions that would attract recruiters."
                ),
                response_mime_type="application/json",
                response_json_schema=ProfileOptimizationOutput.model_json_schema(),
            ),
        )
        return ProfileOptimizationOutput.model_validate_json(response.text)

    # ── Resume Data Extraction ───────────────────────────────────────

    async def extract_resume_data(self, file_bytes: bytes):
        """Extract structured profile data from a resume PDF using Gemini Vision."""
        from app.schemas.ai import ResumeExtractionOutput

        pdf_part = types.Part.from_bytes(
            data=file_bytes,
            mime_type="application/pdf",
        )
        
        prompt = (
            "Extract the candidate's name, headline, location, summary (about), "
            "work experiences, education, and languages from this resume PDF. "
            "Format dates as YYYY-MM-DD or YYYY-MM."
        )

        response = _get_client().models.generate_content(
            model=MODEL,
            contents=[pdf_part, prompt],
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert resume parser. Extract the structured data faithfully "
                    "from the provided resume document. Do not hallucinate."
                ),
                response_mime_type="application/json",
                response_json_schema=ResumeExtractionOutput.model_json_schema(),
            ),
        )
        return ResumeExtractionOutput.model_validate_json(response.text)

    # ── AI Job Recommendations (PDF-based) ───────────────────────────

    async def get_ai_job_recommendations(
        self, resume_text: str, jobs_context: str
    ) -> AIRecommendationsOutput:
        """Score a resume against multiple job descriptions at once.

        ``resume_text`` is the serialised parsed resume data (JSON or text).
        ``jobs_context`` is a pre-formatted string listing all jobs with
        their id, title, company_name, and description.
        """
        user_prompt = (
            "## Candidate Resume\n"
            f"{resume_text}\n\n"
            "## Available Jobs\n"
            f"{jobs_context}\n\n"
            "Analyze the resume above against each of the listed jobs. "
            "For every job, provide a match_score (0-100), strengths, gaps, "
            "and a brief summary. Only include jobs that score above 0. "
            "Return the results ranked by match_score descending."
        )

        response = _get_client().models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert technical recruiter. You are given a "
                    "candidate's resume data and a list of open job "
                    "postings. Evaluate how well the candidate matches each "
                    "job. Be objective, thorough, and fair. Provide numeric "
                    "scores from 0 to 100 and detailed feedback."
                ),
                response_mime_type="application/json",
                response_json_schema=AIRecommendationsOutput.model_json_schema(),
            ),
        )

        return AIRecommendationsOutput.model_validate_json(response.text)

    # ── Single Resume vs Job PDF Score ───────────────────────────────

    async def score_resume_against_job(
        self, resume_pdf_bytes: bytes, job_description: str
    ) -> ResumeMatchOutput:
        """Score an uploaded resume PDF against a single job description."""
        pdf_part = types.Part.from_bytes(
            data=resume_pdf_bytes,
            mime_type="application/pdf",
        )

        user_prompt = (
            "## Job Description\n"
            f"{job_description}\n\n"
            "Analyze the attached resume PDF against the job description above."
        )

        response = _get_client().models.generate_content(
            model=MODEL,
            contents=[pdf_part, user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert technical recruiter. Analyze how well "
                    "the provided resume matches the given job description. "
                    "Be objective, thorough, and fair. Provide a numeric score "
                    "from 0 to 100 and detailed feedback."
                ),
                response_mime_type="application/json",
                response_json_schema=ResumeMatchOutput.model_json_schema(),
            ),
        )

        return ResumeMatchOutput.model_validate_json(response.text)

