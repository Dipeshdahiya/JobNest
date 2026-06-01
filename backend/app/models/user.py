"""User model."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid
from app.db.enums import UserRole


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_constraint=True),
        nullable=False,
        default=UserRole.SEEKER,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────
    seeker_profile: Mapped["SeekerProfile"] = relationship(  # noqa: F821
        back_populates="user",
        uselist=False,
        lazy="selectin",
    )
    employer_profile: Mapped["EmployerProfile"] = relationship(  # noqa: F821
        back_populates="user",
        uselist=False,
        lazy="selectin",
    )
    posts: Mapped[list["Post"]] = relationship(  # noqa: F821
        back_populates="user",
        lazy="selectin",
    )
    applications: Mapped[list["Application"]] = relationship(  # noqa: F821
        back_populates="seeker",
        lazy="selectin",
    )
    messages_sent: Mapped[list["Message"]] = relationship(  # noqa: F821
        foreign_keys="[Message.sender_id]",
        back_populates="sender",
        lazy="selectin",
    )
    messages_received: Mapped[list["Message"]] = relationship(  # noqa: F821
        foreign_keys="[Message.receiver_id]",
        back_populates="receiver",
        lazy="selectin",
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        back_populates="user",
        lazy="selectin",
    )

    # Connections (self-referencing M2M handled via Connection model)
    sent_connections: Mapped[list["Connection"]] = relationship(  # noqa: F821
        foreign_keys="[Connection.requester_id]",
        back_populates="requester",
        lazy="selectin",
    )
    received_connections: Mapped[list["Connection"]] = relationship(  # noqa: F821
        foreign_keys="[Connection.receiver_id]",
        back_populates="receiver",
        lazy="selectin",
    )

    # Social
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        back_populates="user",
        lazy="selectin",
    )
    likes: Mapped[list["Like"]] = relationship(  # noqa: F821
        back_populates="user",
        lazy="selectin",
    )
    saved_jobs: Mapped[list["SavedJob"]] = relationship(  # noqa: F821
        back_populates="user",
        lazy="selectin",
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        back_populates="reporter",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

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
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False
    )
    
    user: Mapped["User"] = relationship()


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
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
    token: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False
    )
    
    user: Mapped["User"] = relationship()
