"""Messaging router — send and retrieve messages."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.messaging import ConversationPartner, MessageCreate, MessageRead
from app.services.messaging_service import MessagingService

router = APIRouter(prefix="/messaging", tags=["Messaging"])


def _svc(db: AsyncSession) -> MessagingService:
    return MessagingService(db)


@router.post("", response_model=MessageRead, status_code=201)
async def send_message(
    payload: MessageCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).send_message(user.id, payload)


@router.get("/conversations", response_model=list[ConversationPartner])
async def list_conversations(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).list_conversations(user.id, skip, limit)


@router.get("/conversation/{partner_id}", response_model=list[MessageRead])
async def get_conversation(
    partner_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 50,
):
    return await _svc(db).get_conversation(user.id, partner_id, skip, limit)


@router.patch("/{message_id}/read", response_model=MessageRead)
async def mark_message_read(
    message_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).mark_as_read(message_id, user.id)
