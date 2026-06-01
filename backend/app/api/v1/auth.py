"""Auth router — registration, login, token refresh."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.user import (
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserRead,
    EmailOTPRequest,
    EmailOTPVerifyRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


def _auth_service(db: AsyncSession = Depends(get_db_session)) -> AuthService:
    return AuthService(db)


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    payload: UserCreate,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    user = await svc.register(payload)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive tokens",
)
async def login(
    payload: LoginRequest,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    return await svc.login(payload.email, payload.password)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh(
    payload: RefreshRequest,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    return await svc.refresh_token(payload.refresh_token)


@router.post(
    "/verify-email",
    status_code=status.HTTP_200_OK,
    summary="Verify email address with OTP",
)
async def verify_email(
    payload: EmailOTPVerifyRequest,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    await svc.verify_email_otp(payload.email, payload.otp_code)
    return {"message": "Email successfully verified"}


@router.post(
    "/resend-otp",
    status_code=status.HTTP_200_OK,
    summary="Resend verification OTP",
)
async def resend_otp(
    payload: EmailOTPRequest,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    await svc.resend_email_otp(payload.email)
    return {"message": "Verification code sent"}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request a password reset link",
)
async def forgot_password(
    payload: PasswordResetRequest,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    await svc.request_password_reset(payload.email)
    return {"message": "If that email exists, a password reset link has been sent"}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset password with token",
)
async def reset_password(
    payload: PasswordResetConfirmRequest,
    svc: Annotated[AuthService, Depends(_auth_service)],
):
    await svc.reset_password(payload.email, payload.token, payload.new_password)
    return {"message": "Password has been reset successfully"}
