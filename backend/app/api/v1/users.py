"""Users router — CRUD operations."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


def _user_service(db: AsyncSession = Depends(get_db_session)) -> UserService:
    return UserService(db)


@router.get("/me", response_model=UserRead, summary="Get current user")
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@router.patch("/me", response_model=UserRead, summary="Update current user")
async def update_me(
    payload: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    svc: Annotated[UserService, Depends(_user_service)],
):
    return await svc.update(current_user.id, payload)


@router.get("/{user_id}", response_model=UserRead, summary="Get user by ID")
async def get_user(
    user_id: str,
    svc: Annotated[UserService, Depends(_user_service)],
):
    import uuid

    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
        )
    user = await svc.get_by_id(uid)
    if user is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user
