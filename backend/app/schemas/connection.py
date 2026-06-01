"""Connection schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.enums import ConnectionStatus


class ConnectionRequest(BaseModel):
    receiver_id: uuid.UUID


class ConnectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester_id: uuid.UUID
    receiver_id: uuid.UUID
    status: ConnectionStatus
    created_at: datetime
