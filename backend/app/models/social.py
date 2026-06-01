"""Social models: Post, Comment, Like, Hashtag + post_hashtags association."""

import uuid

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


# ── Association Table ────────────────────────────────────────────────

post_hashtags = Table(
    "post_hashtags",
    Base.metadata,
    Column(
        "post_id",
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "hashtag_id",
        UUID(as_uuid=True),
        ForeignKey("hashtags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ── Post ─────────────────────────────────────────────────────────────


class Post(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "posts"

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
    content: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    share_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Relationships ────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="posts")  # noqa: F821
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="post",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    likes: Mapped[list["Like"]] = relationship(
        back_populates="post",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    hashtags: Mapped[list["Hashtag"]] = relationship(
        secondary=post_hashtags,
        back_populates="posts",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Post {self.id}>"


# ── Comment ──────────────────────────────────────────────────────────


class Comment(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_comment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # ── Relationships ────────────────────────────────────────────────
    post: Mapped["Post"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")  # noqa: F821
    parent_comment: Mapped["Comment | None"] = relationship(
        remote_side="Comment.id",
        backref="replies",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Comment {self.id}>"


# ── Like ─────────────────────────────────────────────────────────────


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_like_user_post"),
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
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Relationships ────────────────────────────────────────────────
    user: Mapped["User"] = relationship(back_populates="likes")  # noqa: F821
    post: Mapped["Post"] = relationship(back_populates="likes")

    def __repr__(self) -> str:
        return f"<Like user={self.user_id} post={self.post_id}>"


# ── Hashtag ──────────────────────────────────────────────────────────


class Hashtag(Base):
    __tablename__ = "hashtags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Relationships ────────────────────────────────────────────────
    posts: Mapped[list["Post"]] = relationship(
        secondary=post_hashtags,
        back_populates="hashtags",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Hashtag #{self.name}>"
