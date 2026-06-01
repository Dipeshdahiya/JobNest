"""Search service — posts, people, companies via ILIKE."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import EmployerProfile, SeekerProfile
from app.models.social import Post
from app.models.user import User


class SearchService:
    """Simple keyword search using ILIKE."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def search_posts(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> list[Post]:
        pattern = f"%{query}%"
        result = await self.db.execute(
            select(Post)
            .where(
                Post.content.ilike(pattern),
                Post.deleted_at.is_(None),
            )
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def search_people(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> list[dict]:
        pattern = f"%{query}%"
        result = await self.db.execute(
            select(User.id, User.email, SeekerProfile.full_name)
            .outerjoin(SeekerProfile, SeekerProfile.user_id == User.id)
            .where(
                or_(
                    User.email.ilike(pattern),
                    SeekerProfile.full_name.ilike(pattern),
                ),
                User.is_active == True,  # noqa: E712
                User.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
        )
        rows = result.all()
        return [
            {"id": row.id, "email": row.email, "full_name": row.full_name}
            for row in rows
        ]

    async def search_companies(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> list[dict]:
        pattern = f"%{query}%"
        result = await self.db.execute(
            select(
                EmployerProfile.id,
                EmployerProfile.company_name,
                EmployerProfile.industry,
                EmployerProfile.user_id,
            )
            .where(EmployerProfile.company_name.ilike(pattern))
            .offset(skip)
            .limit(limit)
        )
        rows = result.all()
        return [
            {
                "id": row.id,
                "company_name": row.company_name,
                "industry": row.industry,
                "user_id": row.user_id,
            }
            for row in rows
        ]
