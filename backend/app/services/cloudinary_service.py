"""Cloudinary service — file upload, deletion, and secure URL generation.

All Cloudinary interactions are centralised here so routers never
call Cloudinary directly.
"""

import logging

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from app.core.config import settings

logger = logging.getLogger(__name__)

# Late-initialised so we don't fail at import time when keys are empty.
_configured = False


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        _configured = True


class CloudinaryService:
    """Cloudinary file management."""

    async def upload_file(
        self, file_bytes: bytes, folder: str = "uploads", **options: object
    ) -> dict:
        """Upload a file and return the Cloudinary response dict."""
        _ensure_configured()
        try:
            result = cloudinary.uploader.upload(
                file_bytes,
                folder=folder,
                resource_type="raw",
                **options,
            )
            return result
        except Exception as e:
            logger.error("Cloudinary upload failed: %s", e)
            raise

    async def delete_file(self, public_id: str) -> dict:
        """Delete a file by its public_id."""
        _ensure_configured()
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type="raw")
            return result
        except Exception as e:
            logger.error("Cloudinary delete failed: %s", e)
            raise

    async def generate_secure_url(
        self, public_id: str, **transformations: object
    ) -> str:
        """Return a signed Cloudinary URL with optional transformations."""
        _ensure_configured()
        url, _ = cloudinary.utils.cloudinary_url(
            public_id, resource_type="raw", secure=True, **transformations
        )
        return url
