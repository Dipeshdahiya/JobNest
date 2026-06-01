"""Messaging service — send, list, mark read."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import and_, case, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import NotificationType
from app.models.messaging import Message
from app.models.notification import Notification
from app.schemas.messaging import MessageCreate


class MessagingService:
    """Direct messaging between users."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def send_message(
        self, sender_id: uuid.UUID, payload: MessageCreate
    ) -> Message:
        if sender_id == payload.receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send a message to yourself",
            )

        msg = Message(
            sender_id=sender_id,
            receiver_id=payload.receiver_id,
            content=payload.content,
        )
        self.db.add(msg)
        await self.db.flush()

        # Notification for receiver
        notif = Notification(
            user_id=payload.receiver_id,
            type=NotificationType.MESSAGE,
            reference_id=msg.id,
        )
        self.db.add(notif)

        await self.db.commit()
        await self.db.refresh(msg)
        return msg

    async def get_conversation(
        self,
        user_a: uuid.UUID,
        user_b: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == user_a, Message.receiver_id == user_b),
                    and_(Message.sender_id == user_b, Message.receiver_id == user_a),
                )
            )
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_conversations(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[dict]:
        """Return distinct conversation partners with last message time, unread count, partner name, and last message."""

        # Partner id: if I'm the sender, partner is receiver and vice-versa
        partner_id = case(
            (Message.sender_id == user_id, Message.receiver_id),
            else_=Message.sender_id,
        )

        stmt = (
            select(
                partner_id.label("partner_id"),
                func.max(Message.created_at).label("last_message_at"),
                func.sum(
                    case(
                        (
                            and_(
                                Message.receiver_id == user_id,
                                Message.is_read == False,  # noqa: E712
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ).label("unread_count"),
            )
            .where(or_(Message.sender_id == user_id, Message.receiver_id == user_id))
            .group_by(partner_id)
            .order_by(func.max(Message.created_at).desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        # Enrich with partner name and last message content
        from app.models.user import User
        from app.models.profile import SeekerProfile
        from sqlalchemy.orm import selectinload

        conversations = []
        for row in rows:
            # Get partner name
            user_result = await self.db.execute(
                select(User)
                .where(User.id == row.partner_id)
                .options(
                    selectinload(User.seeker_profile),
                    selectinload(User.employer_profile),
                )
            )
            partner_user = user_result.scalar_one_or_none()
            partner_name = "User"
            if partner_user:
                if partner_user.seeker_profile and partner_user.seeker_profile.full_name:
                    partner_name = partner_user.seeker_profile.full_name
                elif partner_user.employer_profile and partner_user.employer_profile.company_name:
                    partner_name = partner_user.employer_profile.company_name
                else:
                    partner_name = partner_user.email.split("@")[0]

            # Get last message content
            last_msg_result = await self.db.execute(
                select(Message)
                .where(
                    or_(
                        and_(Message.sender_id == user_id, Message.receiver_id == row.partner_id),
                        and_(Message.sender_id == row.partner_id, Message.receiver_id == user_id),
                    )
                )
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg = last_msg_result.scalar_one_or_none()

            last_message = None
            if last_msg:
                last_message = {
                    "id": str(last_msg.id),
                    "sender_id": str(last_msg.sender_id),
                    "receiver_id": str(last_msg.receiver_id),
                    "content": last_msg.content,
                    "is_read": last_msg.is_read,
                    "created_at": last_msg.created_at.isoformat(),
                }

            conversations.append(
                {
                    "partner_id": row.partner_id,
                    "partner_name": partner_name,
                    "last_message_at": row.last_message_at,
                    "last_message": last_message,
                    "unread_count": row.unread_count,
                }
            )

        return conversations

    async def mark_as_read(
        self, message_id: uuid.UUID, user_id: uuid.UUID
    ) -> Message:
        result = await self.db.execute(
            select(Message).where(Message.id == message_id)
        )
        msg = result.scalar_one_or_none()
        if msg is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
            )
        if msg.receiver_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the receiver can mark as read",
            )
        msg.is_read = True
        await self.db.commit()
        await self.db.refresh(msg)
        return msg
