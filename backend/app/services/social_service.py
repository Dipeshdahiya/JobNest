"""Social service — posts, comments, likes, hashtags."""

import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, func, insert, select
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.db.enums import NotificationType
from app.models.notification import Notification
from app.models.social import Comment, Hashtag, Like, Post, post_hashtags
from app.models.user import User
from app.schemas.social import CommentCreate, PostCreate, PostUpdate


# Regex to extract hashtags from post content
_HASHTAG_RE = re.compile(r"#(\w+)", re.UNICODE)


class SocialService:
    """Social feed operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Hashtag helpers ──────────────────────────────────────────────

    async def _sync_hashtags(self, post: Post, content: str) -> None:
        """Extract #hashtags from content, get-or-create rows, link to post."""
        tag_names = {t.lower() for t in _HASHTAG_RE.findall(content)}
        if not tag_names:
            return

        for name in tag_names:
            result = await self.db.execute(
                select(Hashtag).where(Hashtag.name == name)
            )
            hashtag = result.scalar_one_or_none()
            if hashtag is None:
                hashtag = Hashtag(name=name, usage_count=1)
                self.db.add(hashtag)
                await self.db.flush()
            else:
                hashtag.usage_count = Hashtag.usage_count + 1
            await self.db.execute(
                insert(post_hashtags).values(
                    post_id=post.id, hashtag_id=hashtag.id
                )
            )

    # ── Posts ─────────────────────────────────────────────────────────

    async def create_post(self, user_id: uuid.UUID, payload: PostCreate) -> Post:
        post = Post(
            user_id=user_id,
            content=payload.content,
            media_url=payload.media_url,
        )
        self.db.add(post)
        await self.db.flush()

        await self._sync_hashtags(post, payload.content)

        await self.db.commit()
        # Re-query with eager loading for user relationship
        return await self.get_post(post.id)

    async def get_post(self, post_id: uuid.UUID) -> Post:
        result = await self.db.execute(
            select(Post)
            .where(Post.id == post_id, Post.deleted_at.is_(None))
            .options(
                selectinload(Post.hashtags),
                joinedload(Post.user).selectinload(User.seeker_profile),
                joinedload(Post.user).selectinload(User.employer_profile),
            )
        )
        post = result.scalar_one_or_none()
        if post is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
            )
        return post

    async def list_feed(
        self, skip: int = 0, limit: int = 20
    ) -> list[Post]:
        result = await self.db.execute(
            select(Post)
            .where(Post.deleted_at.is_(None))
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Post.hashtags),
                joinedload(Post.user).selectinload(User.seeker_profile),
                joinedload(Post.user).selectinload(User.employer_profile),
            )
        )
        return list(result.scalars().all())

    async def update_post(
        self, post_id: uuid.UUID, user_id: uuid.UUID, payload: PostUpdate
    ) -> Post:
        post = await self.get_post(post_id)
        if post.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the post owner can edit",
            )
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(post, field, value)
        await self.db.commit()
        # Re-query with eager loading for user relationship
        return await self.get_post(post_id)

    async def delete_post(self, post_id: uuid.UUID, user_id: uuid.UUID) -> None:
        post = await self.get_post(post_id)
        if post.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the post owner can delete",
            )
        post.deleted_at = datetime.now(timezone.utc)
        await self.db.commit()

    # ── Comments ─────────────────────────────────────────────────────

    async def add_comment(
        self, user_id: uuid.UUID, post_id: uuid.UUID, payload: CommentCreate
    ) -> Comment:
        post = await self.get_post(post_id)

        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=payload.content,
            parent_comment_id=payload.parent_comment_id,
        )
        self.db.add(comment)
        post.comment_count = Post.comment_count + 1
        await self.db.flush()

        # Notification for post owner (skip if commenter is the owner)
        if post.user_id != user_id:
            notif = Notification(
                user_id=post.user_id,
                type=NotificationType.POST_INTERACTION,
                reference_id=post.id,
            )
            self.db.add(notif)

        await self.db.commit()
        # Re-query with eager loading for user relationship
        result = await self.db.execute(
            select(Comment)
            .where(Comment.id == comment.id)
            .options(
                joinedload(Comment.user).selectinload(User.seeker_profile),
                joinedload(Comment.user).selectinload(User.employer_profile),
            )
        )
        return result.scalar_one()

    async def list_comments(
        self, post_id: uuid.UUID, skip: int = 0, limit: int = 50
    ) -> list[Comment]:
        result = await self.db.execute(
            select(Comment)
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at.asc())
            .offset(skip)
            .limit(limit)
            .options(
                joinedload(Comment.user).selectinload(User.seeker_profile),
                joinedload(Comment.user).selectinload(User.employer_profile),
            )
        )
        return list(result.scalars().all())

    async def delete_comment(
        self, comment_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        result = await self.db.execute(
            select(Comment).where(Comment.id == comment_id)
        )
        comment = result.scalar_one_or_none()
        if comment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
            )
        if comment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the comment author can delete",
            )

        # Decrement counter on the parent post
        post_result = await self.db.execute(
            select(Post).where(Post.id == comment.post_id)
        )
        post = post_result.scalar_one_or_none()
        if post is not None:
            post.comment_count = Post.comment_count - 1

        await self.db.execute(delete(Comment).where(Comment.id == comment_id))
        await self.db.commit()

    # ── Likes ────────────────────────────────────────────────────────

    async def like_post(self, user_id: uuid.UUID, post_id: uuid.UUID) -> Like:
        post = await self.get_post(post_id)

        like = Like(user_id=user_id, post_id=post_id)
        self.db.add(like)
        try:
            await self.db.flush()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already liked this post",
            )

        post.like_count = Post.like_count + 1

        # Notification
        if post.user_id != user_id:
            notif = Notification(
                user_id=post.user_id,
                type=NotificationType.POST_INTERACTION,
                reference_id=post.id,
            )
            self.db.add(notif)

        await self.db.commit()
        await self.db.refresh(like)
        return like

    async def unlike_post(self, user_id: uuid.UUID, post_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(Like).where(Like.user_id == user_id, Like.post_id == post_id)
        )
        like = result.scalar_one_or_none()
        if like is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Like not found",
            )

        post_result = await self.db.execute(
            select(Post).where(Post.id == post_id)
        )
        post = post_result.scalar_one_or_none()
        if post is not None:
            post.like_count = Post.like_count - 1

        await self.db.execute(
            delete(Like).where(Like.user_id == user_id, Like.post_id == post_id)
        )
        await self.db.commit()

    # ── Hashtags / Trending ──────────────────────────────────────────

    async def get_trending_hashtags(self, limit: int = 10) -> list[Hashtag]:
        result = await self.db.execute(
            select(Hashtag)
            .order_by(Hashtag.usage_count.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_posts_by_hashtag(
        self, hashtag_name: str, skip: int = 0, limit: int = 20
    ) -> list[Post]:
        result = await self.db.execute(
            select(Post)
            .join(post_hashtags, Post.id == post_hashtags.c.post_id)
            .join(Hashtag, Hashtag.id == post_hashtags.c.hashtag_id)
            .where(Hashtag.name == hashtag_name.lower(), Post.deleted_at.is_(None))
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Post.hashtags),
                joinedload(Post.user).selectinload(User.seeker_profile),
                joinedload(Post.user).selectinload(User.employer_profile),
            )
        )
        return list(result.scalars().all())
