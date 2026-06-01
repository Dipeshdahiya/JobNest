"""Notifications router — list and mark read."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _svc(db: AsyncSession) -> NotificationService:
    return NotificationService(db)


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).list_for_user(user.id, skip, limit)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).mark_as_read(notification_id, user.id)


@router.patch("/read-all")
async def mark_all_notifications_read(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    count = await _svc(db).mark_all_read(user.id)
    return {"marked_read": count}
