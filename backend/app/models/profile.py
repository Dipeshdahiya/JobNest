"""Seeker and Employer profile models, plus child entities."""

import uuid
from datetime import date

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, generate_uuid
from app.db.enums import ProfileVisibility


# ── Seeker Profile ───────────────────────────────────────────────────


class SeekerProfile(Base, TimestampMixin):
    __tablename__ = "seeker_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    about: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    resume_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    profile_visibility: Mapped[ProfileVisibility] = mapped_column(
        Enum(ProfileVisibility, name="profile_visibility", create_constraint=True),
        default=ProfileVisibility.PUBLIC,
        nullable=False,
    )
    profile_views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    resume_views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    parsed_resume_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # ── Relationships ────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="seeker_profile")  # noqa: F821
    experiences: Mapped[list["Experience"]] = relationship(
        back_populates="seeker_profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    education_entries: Mapped[list["EducationEntry"]] = relationship(
        back_populates="seeker_profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    skills: Mapped[list["Skill"]] = relationship(  # noqa: F821
        secondary="seeker_skills",
        back_populates="seekers",
        lazy="selectin",
    )
    certifications: Mapped[list["Certification"]] = relationship(
        back_populates="seeker_profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    languages: Mapped[list["Language"]] = relationship(
        back_populates="seeker_profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    projects: Mapped[list["Project"]] = relationship(
        back_populates="seeker_profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<SeekerProfile {self.full_name}>"


# ── Employer Profile ─────────────────────────────────────────────────


class EmployerProfile(Base, TimestampMixin):
    __tablename__ = "employer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    headquarters: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employees_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Relationships ────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="employer_profile")  # noqa: F821
    jobs: Mapped[list["Job"]] = relationship(  # noqa: F821
        back_populates="employer_profile",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<EmployerProfile {self.company_name}>"


# ── Child Entities of SeekerProfile ──────────────────────────────────


class Experience(Base):
    __tablename__ = "experiences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    seeker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seeker_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    seeker_profile: Mapped["SeekerProfile"] = relationship(
        back_populates="experiences"
    )

    def __repr__(self) -> str:
        return f"<Experience {self.title} @ {self.company_name}>"


class EducationEntry(Base):
    __tablename__ = "education_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    seeker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seeker_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    degree: Mapped[str | None] = mapped_column(String(255), nullable=True)
    field_of_study: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    seeker_profile: Mapped["SeekerProfile"] = relationship(
        back_populates="education_entries"
    )

    def __repr__(self) -> str:
        return f"<EducationEntry {self.institution}>"


class Certification(Base):
    __tablename__ = "certifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    seeker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seeker_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    seeker_profile: Mapped["SeekerProfile"] = relationship(
        back_populates="certifications"
    )

    def __repr__(self) -> str:
        return f"<Certification {self.name}>"


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    seeker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seeker_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    proficiency: Mapped[str | None] = mapped_column(String(50), nullable=True)

    seeker_profile: Mapped["SeekerProfile"] = relationship(
        back_populates="languages"
    )

    def __repr__(self) -> str:
        return f"<Language {self.name}>"

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    seeker_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seeker_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    seeker_profile: Mapped["SeekerProfile"] = relationship(
        back_populates="projects"
    )

    def __repr__(self) -> str:
        return f"<Project {self.name}>"
