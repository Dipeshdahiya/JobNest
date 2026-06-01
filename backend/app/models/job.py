"""Job and Skill models with association tables."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid
from app.db.enums import ExperienceLevel, JobStatus, JobType


# ── Association Tables ───────────────────────────────────────────────

seeker_skills = Table(
    "seeker_skills",
    Base.metadata,
    Column(
        "seeker_profile_id",
        UUID(as_uuid=True),
        ForeignKey("seeker_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "skill_id",
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

job_skills = Table(
    "job_skills",
    Base.metadata,
    Column(
        "job_id",
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "skill_id",
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ── Skill ────────────────────────────────────────────────────────────


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )

    # ── Relationships ────────────────────────────────────────────────
    seekers: Mapped[list["SeekerProfile"]] = relationship(  # noqa: F821
        secondary=seeker_skills,
        back_populates="skills",
        lazy="noload",
    )
    jobs: Mapped[list["Job"]] = relationship(
        secondary=job_skills,
        back_populates="skills",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<Skill {self.name}>"


# ── Job ──────────────────────────────────────────────────────────────


class Job(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    employer_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    what_to_expect: Mapped[str | None] = mapped_column(Text, nullable=True)
    additional_benefits: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    salary_min: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    salary_max: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    experience_level: Mapped[ExperienceLevel] = mapped_column(
        Enum(ExperienceLevel, name="experience_level", create_constraint=True),
        nullable=False,
    )
    job_type: Mapped[JobType] = mapped_column(
        Enum(JobType, name="job_type", create_constraint=True),
        nullable=False,
    )
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status", create_constraint=True),
        default=JobStatus.OPEN,
        nullable=False,
    )
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    applications_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    openings: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Relationships ────────────────────────────────────────────────
    employer_profile: Mapped["EmployerProfile"] = relationship(  # noqa: F821
        back_populates="jobs"
    )
    skills: Mapped[list["Skill"]] = relationship(
        secondary=job_skills,
        back_populates="jobs",
        lazy="selectin",
    )
    applications: Mapped[list["Application"]] = relationship(  # noqa: F821
        back_populates="job",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<Job {self.title}>"


class SavedJob(Base, TimestampMixin):
    __tablename__ = "saved_jobs"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_saved_job_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="saved_jobs")  # noqa: F821
    job: Mapped["Job"] = relationship()  # noqa: F821

    def __repr__(self) -> str:
        return f"<SavedJob user={self.user_id} job={self.job_id}>"


class JobEditApprovalToken(Base, TimestampMixin):
    """OTP-based approval for non-owner employees to edit a company's job posting."""

    __tablename__ = "job_edit_approval_tokens"

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
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requester_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<JobEditApprovalToken job={self.job_id} requester={self.requester_user_id}>"
