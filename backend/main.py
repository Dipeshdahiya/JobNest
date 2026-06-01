"""Career Canvas — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1 import v1_router
from app.core.config import settings
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)

# ── Rate limiter ─────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])


# ── Lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown hooks."""
    setup_logging()
    logger.info("🚀 %s v%s starting", settings.APP_NAME, settings.APP_VERSION)
    yield
    logger.info("👋 %s shutting down", settings.APP_NAME)


# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────
app.include_router(v1_router)


# ── Health check ─────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "healthy"}
