"""Report and moderation schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.enums import ReportStatus, ReportTargetType


class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: str


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_id: uuid.UUID
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: str
    status: ReportStatus
    created_at: datetime
