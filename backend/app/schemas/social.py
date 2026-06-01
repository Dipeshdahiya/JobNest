"""Social schemas — Post, Comment, Like, Hashtag."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Hashtag ──────────────────────────────────────────────────────────


class HashtagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    usage_count: int = 0


# ── Comment ──────────────────────────────────────────────────────────


class CommentBase(BaseModel):
    content: str = Field(max_length=2000)


class CommentCreate(CommentBase):
    parent_comment_id: uuid.UUID | None = None


class CommentRead(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    parent_comment_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


# ── Like ─────────────────────────────────────────────────────────────


class LikeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    post_id: uuid.UUID


# ── Post ─────────────────────────────────────────────────────────────


class PostBase(BaseModel):
    content: str = Field(max_length=5000)


class PostCreate(PostBase):
    media_url: str | None = None
    hashtag_names: list[str] = []


class PostRead(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    media_url: str | None = None
    like_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    hashtags: list[HashtagRead] = []
    created_at: datetime
    updated_at: datetime


class PostUpdate(BaseModel):
    content: str | None = Field(default=None, max_length=5000)
    media_url: str | None = None

