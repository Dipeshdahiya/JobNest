"""Application model."""

import uuid

from sqlalchemy import (
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, generate_uuid
from app.db.enums import ApplicationStatus


class Application(Base, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "seeker_id", name="uq_application_job_seeker"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    seeker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status", create_constraint=True),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )
    ai_match_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_review_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────────
    job: Mapped["Job"] = relationship(back_populates="applications")  # noqa: F821
    seeker: Mapped["User"] = relationship(back_populates="applications")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Application job={self.job_id} seeker={self.seeker_id}>"
