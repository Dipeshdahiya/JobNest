"""Structured logging configuration."""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """Configure the root logger with a structured format.

    Log level is driven by ``settings.LOG_LEVEL``.
    """
    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
    )
    logging.basicConfig(
        level=settings.LOG_LEVEL.upper(),
        format=log_format,
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Quieten noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
