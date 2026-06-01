"""Base ORM classes and mixins for all SQLAlchemy models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Mixin that adds a deleted_at column for soft deletes."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )


def generate_uuid() -> uuid.UUID:
    """Generate a new UUID v4."""
    return uuid.uuid4()


# Reusable UUID primary key column type
uuid_pk = mapped_column(
    UUID(as_uuid=True),
    primary_key=True,
    default=generate_uuid,
    server_default=func.gen_random_uuid(),
)
