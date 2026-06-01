"""User and authentication schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.enums import UserRole


# ── User ─────────────────────────────────────────────────────────────


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.SEEKER


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    is_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


# ── Auth tokens ──────────────────────────────────────────────────────


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class EmailOTPRequest(BaseModel):
    email: EmailStr


class EmailOTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(min_length=6, max_length=6)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=128)
