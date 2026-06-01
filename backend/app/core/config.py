"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration — every value is read from the .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────
    APP_NAME: str = "JobNest"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── JWT ───────────────────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Cloudinary ───────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ── Gemini AI ────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    # ── SMTP / Email ─────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "official.jobnest1@gmail.com"

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8080", "http://localhost:5173"]

    # ── Logging ──────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

    # ── Rate Limiting ────────────────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = "60/minute"


settings = Settings()
