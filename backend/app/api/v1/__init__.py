"""API v1 — aggregate all domain routers under a single prefix."""

from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.ai import router as ai_router
from app.api.v1.applications import router as applications_router
from app.api.v1.auth import router as auth_router
from app.api.v1.connections import router as connections_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.messaging import router as messaging_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.search import router as search_router
from app.api.v1.social import router as social_router
from app.api.v1.users import router as users_router
from app.api.v1.reports import router as reports_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(profiles_router)
v1_router.include_router(jobs_router)
v1_router.include_router(applications_router)
v1_router.include_router(admin_router)
v1_router.include_router(connections_router)
v1_router.include_router(social_router)
v1_router.include_router(messaging_router)
v1_router.include_router(notifications_router)
v1_router.include_router(ai_router)
v1_router.include_router(search_router)
v1_router.include_router(reports_router)

