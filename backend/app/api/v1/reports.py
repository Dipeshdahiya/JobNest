"""Reports router — moderation system."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.enums import UserRole, ReportStatus
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.report import ReportCreate, ReportRead
from app.services.moderation_service import ModerationService
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="", tags=["Reports"])


def _moderation_service(db: AsyncSession = Depends(get_db_session)) -> ModerationService:
    return ModerationService(db)


@router.post(
    "/reports",
    response_model=ReportRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a moderation report",
)
async def create_report(
    payload: ReportCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    mod_svc: Annotated[ModerationService, Depends(_moderation_service)],
):
    return await mod_svc.create_report(current_user.id, payload)


@router.get(
    "/admin/reports",
    response_model=list[ReportRead],
    summary="List all reports (admin only)",
)
async def list_reports(
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    mod_svc: Annotated[ModerationService, Depends(_moderation_service)],
    pagination: Annotated[PaginationParams, Depends()],
    status_filter: ReportStatus | None = Query(None, alias="status"),
):
    return await mod_svc.list_reports(
        skip=pagination.skip, limit=pagination.limit, status_filter=status_filter
    )


@router.patch(
    "/admin/reports/{report_id}/review",
    response_model=ReportRead,
    summary="Mark report as reviewed (admin only)",
)
async def review_report(
    report_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    mod_svc: Annotated[ModerationService, Depends(_moderation_service)],
):
    return await mod_svc.review_report(report_id)


@router.patch(
    "/admin/reports/{report_id}/dismiss",
    response_model=ReportRead,
    summary="Mark report as dismissed (admin only)",
)
async def dismiss_report(
    report_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    mod_svc: Annotated[ModerationService, Depends(_moderation_service)],
):
    return await mod_svc.dismiss_report(report_id)
