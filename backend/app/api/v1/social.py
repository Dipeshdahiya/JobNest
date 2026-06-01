"""Social router — posts, comments, likes, hashtags."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.social import (
    CommentCreate,
    CommentRead,
    HashtagRead,
    LikeRead,
    PostCreate,
    PostRead,
    PostUpdate,
)
from app.services.social_service import SocialService

router = APIRouter(prefix="/social", tags=["Social"])


def _svc(db: AsyncSession) -> SocialService:
    return SocialService(db)


def _get_author_name(user) -> str:
    """Extract display name from a User ORM object."""
    if user and user.seeker_profile and user.seeker_profile.full_name:
        return user.seeker_profile.full_name
    if user and user.employer_profile and user.employer_profile.company_name:
        return user.employer_profile.company_name
    if user:
        return user.email.split("@")[0]
    return "Unknown"


def _enrich_post(post) -> dict:
    """Convert Post ORM to dict with author_name."""
    data = PostRead.model_validate(post).model_dump()
    data["author_name"] = _get_author_name(post.user)
    return data


def _enrich_comment(comment) -> dict:
    """Convert Comment ORM to dict with author_name."""
    data = CommentRead.model_validate(comment).model_dump()
    data["author_name"] = _get_author_name(comment.user)
    return data


# ── Posts ─────────────────────────────────────────────────────────────


@router.post("/posts", status_code=201)
async def create_post(
    payload: PostCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    post = await _svc(db).create_post(user.id, payload)
    return _enrich_post(post)


@router.get("/feed")
async def get_feed(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 20,
):
    posts = await _svc(db).list_feed(skip, limit)
    return [_enrich_post(p) for p in posts]


@router.get("/posts/{post_id}")
async def get_post(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    post = await _svc(db).get_post(post_id)
    return _enrich_post(post)


@router.patch("/posts/{post_id}")
async def update_post(
    post_id: uuid.UUID,
    payload: PostUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    post = await _svc(db).update_post(post_id, user.id, payload)
    return _enrich_post(post)


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    await _svc(db).delete_post(post_id, user.id)


# ── Comments ─────────────────────────────────────────────────────────


@router.post("/posts/{post_id}/comments", status_code=201)
async def add_comment(
    post_id: uuid.UUID,
    payload: CommentCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    comment = await _svc(db).add_comment(user.id, post_id, payload)
    return _enrich_comment(comment)


@router.get("/posts/{post_id}/comments")
async def list_comments(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 50,
):
    comments = await _svc(db).list_comments(post_id, skip, limit)
    return [_enrich_comment(c) for c in comments]


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    await _svc(db).delete_comment(comment_id, user.id)


# ── Likes ────────────────────────────────────────────────────────────


@router.post("/posts/{post_id}/like", response_model=LikeRead, status_code=201)
async def like_post(
    post_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).like_post(user.id, post_id)


@router.delete("/posts/{post_id}/like", status_code=204)
async def unlike_post(
    post_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    await _svc(db).unlike_post(user.id, post_id)


# ── Hashtags / Trending ──────────────────────────────────────────────


@router.get("/trending", response_model=list[HashtagRead])
async def trending_hashtags(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = 10,
):
    return await _svc(db).get_trending_hashtags(limit)


@router.get("/hashtag/{name}")
async def posts_by_hashtag(
    name: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 20,
):
    posts = await _svc(db).get_posts_by_hashtag(name, skip, limit)
    return [_enrich_post(p) for p in posts]
