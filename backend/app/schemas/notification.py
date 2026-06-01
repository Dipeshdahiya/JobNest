"""Notification schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.enums import NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    reference_id: uuid.UUID | None = None
    is_read: bool = False
    created_at: datetime


class NotificationUpdate(BaseModel):
    is_read: bool
