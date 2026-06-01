"""Connection model — self-referencing many-to-many on users."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, generate_uuid
from app.db.enums import ConnectionStatus


class Connection(Base):
    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint(
            "requester_id", "receiver_id", name="uq_connection_requester_receiver"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    receiver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ConnectionStatus] = mapped_column(
        Enum(ConnectionStatus, name="connection_status", create_constraint=True),
        default=ConnectionStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────
    requester: Mapped["User"] = relationship(  # noqa: F821
        foreign_keys=[requester_id],
        back_populates="sent_connections",
    )
    receiver: Mapped["User"] = relationship(  # noqa: F821
        foreign_keys=[receiver_id],
        back_populates="received_connections",
    )

    def __repr__(self) -> str:
        return f"<Connection {self.requester_id} → {self.receiver_id} ({self.status.value})>"
