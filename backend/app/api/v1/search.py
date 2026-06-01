"""Search router — posts, people, companies."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.social import PostRead
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])


def _svc(db: AsyncSession) -> SearchService:
    return SearchService(db)


@router.get("/posts", response_model=list[PostRead])
async def search_posts(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    q: str = Query(min_length=1, max_length=200),
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).search_posts(q, skip, limit)


@router.get("/people")
async def search_people(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    q: str = Query(min_length=1, max_length=200),
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).search_people(q, skip, limit)


@router.get("/companies")
async def search_companies(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    q: str = Query(min_length=1, max_length=200),
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).search_companies(q, skip, limit)
