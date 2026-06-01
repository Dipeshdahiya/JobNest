"""Notification service — create and list notifications."""

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import NotificationType
from app.models.notification import Notification


class NotificationService:
    """Notification lifecycle management."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        reference_id: uuid.UUID | None = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=notification_type,
            reference_id=reference_id,
        )
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def list_for_user(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_as_read(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Notification:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notif = result.scalar_one_or_none()
        if notif is None or notif.user_id != user_id:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )
        notif.is_read = True
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount  # type: ignore[return-value]
