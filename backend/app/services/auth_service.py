"""Authentication service — registration, login, refresh."""

import logging
import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.enums import UserRole
from app.models.user import User, EmailVerificationToken, PasswordResetToken
from app.schemas.user import TokenResponse, UserCreate
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class AuthService:
    """Handles user registration, login, and token refresh."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, payload: UserCreate) -> User:
        """Register a new user account."""
        # Check email uniqueness
        result = await self.db.execute(
            select(User).where(User.email == payload.email)
        )
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

        # Email-domain rules:
        # - Job seekers: only Gmail is allowed (consumer registrations)
        # - Employers: must use a non-personal/company domain
        domain = payload.email.split("@")[-1].lower()
        personal_domains = {
            "gmail.com",
            "yahoo.com",
            "outlook.com",
            "hotmail.com",
            "live.com",
            "msn.com",
            "icloud.com",
            "proton.me",
            "protonmail.com",
            "aol.com",
            "gmx.com",
            "zoho.com",
        }

        if payload.role == UserRole.SEEKER and domain != "gmail.com":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job seeker registrations are only allowed with @gmail.com addresses.",
            )

        if payload.role == UserRole.EMPLOYER and domain in personal_domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Please use your company email address (e.g. you@yourcompany.com) "
                    "for employer accounts. Personal domains like Gmail are not allowed."
                ),
            )

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
        )
        self.db.add(user)
        await self.db.flush()
        
        await self.generate_email_otp(user)
        
        await self.db.refresh(user)
        return user

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate user and return access + refresh tokens."""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email is not verified",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        # Enforce same email rules on login as on registration
        domain = user.email.split("@")[-1].lower()
        personal_domains = {
            "gmail.com",
            "yahoo.com",
            "outlook.com",
            "hotmail.com",
            "live.com",
            "msn.com",
            "icloud.com",
            "proton.me",
            "protonmail.com",
            "aol.com",
            "gmx.com",
            "zoho.com",
        }

        if user.role == UserRole.SEEKER and domain != "gmail.com":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Job seeker accounts must use @gmail.com addresses.",
            )

        if user.role == UserRole.EMPLOYER and domain in personal_domains:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employer accounts must use a company email (not a personal provider like Gmail).",
            )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        token_data = {"sub": str(user.id), "role": user.role.value}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Issue a new access token from a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload",
            )

        import uuid

        result = await self.db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()

        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or deactivated",
            )

        token_data = {"sub": str(user.id), "role": user.role.value}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    async def generate_email_otp(self, user: User) -> None:
        """Generate and send a 6-digit OTP code."""
        otp_code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        token = EmailVerificationToken(
            user_id=user.id,
            otp_code=otp_code,
            expires_at=expires_at,
        )
        self.db.add(token)
        await self.db.flush()
        
        email_svc = EmailService()
        await email_svc.send_otp_email(user.email, otp_code)

    async def verify_email_otp(self, email: str, otp_code: str) -> None:
        """Validate an OTP code and mark the user as verified."""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified",
            )
            
        result = await self.db.execute(
            select(EmailVerificationToken)
            .where(
                EmailVerificationToken.user_id == user.id,
                EmailVerificationToken.is_used == False,
            )
            .order_by(EmailVerificationToken.created_at.desc())
        )
        token = result.scalars().first()
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification token found",
            )
            
        if token.otp_code != otp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code",
            )
            
        if token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired",
            )
            
        token.is_used = True
        user.is_verified = True
        await self.db.flush()

    async def resend_email_otp(self, email: str) -> None:
        """Invalidate old tokens and send a new OTP."""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
            
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified",
            )
            
        # Invalidate existing unused tokens
        result = await self.db.execute(
            select(EmailVerificationToken)
            .where(
                EmailVerificationToken.user_id == user.id,
                EmailVerificationToken.is_used == False,
            )
        )
        for token in result.scalars().all():
            token.is_used = True
            
        await self.generate_email_otp(user)

    async def request_password_reset(self, email: str) -> None:
        """Generate a password reset token and send email."""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            return  # Prevent email enumeration
            
        import secrets
        from app.core.config import settings
        
        raw_token = secrets.token_urlsafe(32)
        hashed_token = hash_password(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        # Invalidate old unused tokens
        result = await self.db.execute(
            select(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.is_used == False,
            )
        )
        for token in result.scalars().all():
            token.is_used = True
            
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=hashed_token,
            expires_at=expires_at,
        )
        self.db.add(reset_token)
        await self.db.flush()
        
        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
        reset_link = f"{frontend_url}/reset-password?token={raw_token}&email={user.email}"
        
        email_svc = EmailService()
        await email_svc.send_password_reset_email(user.email, reset_link)

    async def reset_password(self, email: str, raw_token: str, new_password: str) -> None:
        """Validate token and reset the user's password."""
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token or email",
            )
            
        result = await self.db.execute(
            select(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.is_used == False,
            )
            .order_by(PasswordResetToken.created_at.desc())
        )
        
        valid_token = None
        for token in result.scalars().all():
            if verify_password(raw_token, token.token):
                valid_token = token
                break
                
        if not valid_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token or email",
            )
            
        if valid_token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired",
            )
            
        valid_token.is_used = True
        user.hashed_password = hash_password(new_password)
        await self.db.flush()
