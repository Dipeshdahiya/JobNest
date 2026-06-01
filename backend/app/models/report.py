"""Report model for moderation."""

import uuid

from sqlalchemy import Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, generate_uuid
from app.db.enums import ReportStatus, ReportTargetType


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_type: Mapped[ReportTargetType] = mapped_column(
        Enum(ReportTargetType, name="report_target_type", create_constraint=True),
        nullable=False,
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status", create_constraint=True),
        default=ReportStatus.PENDING,
        nullable=False,
    )

    # Relationships
    reporter: Mapped["User"] = relationship(back_populates="reports", lazy="selectin")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Report target={self.target_id} type={self.target_type}>"
