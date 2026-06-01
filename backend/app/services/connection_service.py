"""Connection service — send, accept, reject, list."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ConnectionStatus, NotificationType
from app.models.connection import Connection
from app.schemas.connection import ConnectionRequest


class ConnectionService:
    """Manage user connections (friend-requests)."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Send ─────────────────────────────────────────────────────────

    async def send_request(
        self, requester_id: uuid.UUID, payload: ConnectionRequest
    ) -> Connection:
        receiver_id = payload.receiver_id

        # Cannot connect to self
        if requester_id == receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send a connection request to yourself",
            )

        # Check for existing connection in either direction
        existing = await self.db.execute(
            select(Connection).where(
                or_(
                    (Connection.requester_id == requester_id)
                    & (Connection.receiver_id == receiver_id),
                    (Connection.requester_id == receiver_id)
                    & (Connection.receiver_id == requester_id),
                )
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Connection request already exists",
            )

        conn = Connection(
            requester_id=requester_id,
            receiver_id=receiver_id,
            status=ConnectionStatus.PENDING,
        )
        self.db.add(conn)
        await self.db.flush()

        # Fire notification (inline to avoid circular import)
        from app.models.notification import Notification

        notif = Notification(
            user_id=receiver_id,
            type=NotificationType.CONNECTION_REQUEST,
            reference_id=conn.id,
        )
        self.db.add(notif)

        await self.db.commit()
        await self.db.refresh(conn)
        return conn

    # ── Accept / Reject ──────────────────────────────────────────────

    async def _transition(
        self,
        connection_id: uuid.UUID,
        current_user_id: uuid.UUID,
        new_status: ConnectionStatus,
    ) -> Connection:
        result = await self.db.execute(
            select(Connection).where(Connection.id == connection_id)
        )
        conn = result.scalar_one_or_none()
        if conn is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connection not found",
            )
        if conn.receiver_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the receiver can respond to a connection request",
            )
        if conn.status != ConnectionStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection is already {conn.status.value}",
            )

        conn.status = new_status
        await self.db.commit()
        await self.db.refresh(conn)
        return conn

    async def accept(
        self, connection_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> Connection:
        return await self._transition(
            connection_id, current_user_id, ConnectionStatus.ACCEPTED
        )

    async def reject(
        self, connection_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> Connection:
        return await self._transition(
            connection_id, current_user_id, ConnectionStatus.REJECTED
        )

    # ── List ─────────────────────────────────────────────────────────

    async def list_connections(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[Connection]:
        result = await self.db.execute(
            select(Connection)
            .where(
                or_(
                    Connection.requester_id == user_id,
                    Connection.receiver_id == user_id,
                ),
                Connection.status == ConnectionStatus.ACCEPTED,
            )
            .offset(skip)
            .limit(limit)
            .order_by(Connection.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_pending(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> list[Connection]:
        result = await self.db.execute(
            select(Connection)
            .where(
                Connection.receiver_id == user_id,
                Connection.status == ConnectionStatus.PENDING,
            )
            .offset(skip)
            .limit(limit)
            .order_by(Connection.created_at.desc())
        )
        return list(result.scalars().all())
