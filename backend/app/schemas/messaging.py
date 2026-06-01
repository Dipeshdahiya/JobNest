"""Messaging schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    receiver_id: uuid.UUID
    content: str = Field(max_length=5000)


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    content: str
    is_read: bool = False
    created_at: datetime


class ConversationPartner(BaseModel):
    partner_id: uuid.UUID
    partner_name: str = "User"
    last_message_at: datetime
    last_message: MessageRead | None = None
    unread_count: int = 0
