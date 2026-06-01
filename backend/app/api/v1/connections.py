"""Connections router — send, accept, reject, list."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.connection import ConnectionRead, ConnectionRequest
from app.services.connection_service import ConnectionService

router = APIRouter(prefix="/connections", tags=["Connections"])


def _svc(db: AsyncSession) -> ConnectionService:
    return ConnectionService(db)


@router.post("/request", response_model=ConnectionRead, status_code=201)
async def send_connection_request(
    payload: ConnectionRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).send_request(user.id, payload)


@router.patch("/{connection_id}/accept", response_model=ConnectionRead)
async def accept_connection(
    connection_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).accept(connection_id, user.id)


@router.patch("/{connection_id}/reject", response_model=ConnectionRead)
async def reject_connection(
    connection_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _svc(db).reject(connection_id, user.id)


@router.get("", response_model=list[ConnectionRead])
async def list_connections(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).list_connections(user.id, skip, limit)


@router.get("/pending", response_model=list[ConnectionRead])
async def list_pending_requests(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    skip: int = 0,
    limit: int = 20,
):
    return await _svc(db).list_pending(user.id, skip, limit)
