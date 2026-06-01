"""Moderation service for handling reports."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.db.enums import ReportStatus, ReportTargetType
from app.schemas.report import ReportCreate


class ModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_report(self, reporter_id: uuid.UUID, payload: ReportCreate) -> Report:
        """Create a new report."""
        if payload.target_type == ReportTargetType.USER and payload.target_id == reporter_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot report yourself",
            )
            
        # Prevent duplications
        existing = await self.db.execute(
            select(Report).where(
                and_(
                    Report.reporter_id == reporter_id,
                    Report.target_type == payload.target_type,
                    Report.target_id == payload.target_id,
                    Report.status == ReportStatus.PENDING,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a pending report for this item",
            )
            
        report = Report(
            reporter_id=reporter_id,
            target_type=payload.target_type,
            target_id=payload.target_id,
            reason=payload.reason,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def list_reports(self, skip: int = 0, limit: int = 20, status_filter: ReportStatus | None = None) -> list[Report]:
        """List reports (for admins)."""
        query = select(Report)
        if status_filter:
            query = query.where(Report.status == status_filter)
        query = query.order_by(Report.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def review_report(self, report_id: uuid.UUID) -> Report:
        """Mark a report as reviewed."""
        result = await self.db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
            )
        report.status = ReportStatus.REVIEWED
        await self.db.flush()
        return report

    async def dismiss_report(self, report_id: uuid.UUID) -> Report:
        """Mark a report as dismissed."""
        result = await self.db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
            )
        report.status = ReportStatus.DISMISSED
        await self.db.flush()
        return report
