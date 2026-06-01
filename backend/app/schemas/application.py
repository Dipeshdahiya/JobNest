"""Application schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.enums import ApplicationStatus


class ApplicationBase(BaseModel):
    cover_letter: str | None = None


class ApplicationCreate(ApplicationBase):
    job_id: uuid.UUID


class ApplicationRead(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    seeker_id: uuid.UUID
    resume_url: str | None = None
    status: ApplicationStatus
    ai_match_score: int | None = None
    ai_review_text: str | None = None
    created_at: datetime
    updated_at: datetime


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
