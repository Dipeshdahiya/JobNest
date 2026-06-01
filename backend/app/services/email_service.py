"""Email service — SMTP-based notifications.

All outbound email is routed through this service so routers never
deal with SMTP configuration directly.
"""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """SMTP email delivery (fire-and-forget with error logging)."""

    async def _send_email(self, to_email: str, subject: str, body_html: str) -> None:
        """Send an email via SMTP. Logs errors but does not raise."""
        import aiosmtplib

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = settings.MAIL_FROM
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_html, "html"))

            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )
            logger.info("Email sent to %s: %s", to_email, subject)
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to_email, e)

    async def send_application_submitted(
        self, to_email: str, job_title: str, applicant_name: str
    ) -> None:
        """Notify employer that someone applied to their job."""
        subject = f"New Application: {job_title}"
        body = f"""
        <h2>New Application Received</h2>
        <p><strong>{applicant_name}</strong> has applied to your job posting: <strong>{job_title}</strong>.</p>
        <p>Log in to Career Canvas to review the application.</p>
        """
        await self._send_email(to_email, subject, body)

    async def send_application_status_update(
        self, to_email: str, job_title: str, new_status: str
    ) -> None:
        """Inform an applicant that their application status changed."""
        subject = f"Application Update: {job_title}"
        body = f"""
        <h2>Application Status Update</h2>
        <p>Your application for <strong>{job_title}</strong> has been updated to: <strong>{new_status}</strong>.</p>
        <p>Log in to Career Canvas for more details.</p>
        """
        await self._send_email(to_email, subject, body)

    async def send_job_alert(self, to_email: str, job_title: str, job_url: str) -> None:
        """Notify a seeker about a new job matching their preferences."""
        subject = f"New Job Alert: {job_title}"
        body = f"""
        <h2>New Job Matching Your Profile</h2>
        <p>A new job has been posted: <strong>{job_title}</strong>.</p>
        <p><a href="{job_url}">View Job Details</a></p>
        """
        await self._send_email(to_email, subject, body)

    async def send_message_notification(
        self, to_email: str, sender_name: str
    ) -> None:
        """Let a user know they received a new direct message."""
        subject = f"New Message from {sender_name}"
        body = f"""
        <h2>New Message</h2>
        <p>You have a new message from <strong>{sender_name}</strong>.</p>
        <p>Log in to Career Canvas to read it.</p>
        """
        await self._send_email(to_email, subject, body)

    async def send_job_edit_otp(
        self,
        owner_email: str,
        requester_email: str,
        job_title: str,
        otp_code: str,
    ) -> None:
        """Send an OTP to the original job poster so another employee can edit the job."""
        subject = f"JobNest - Edit approval requested for '{job_title}'"
        body = f"""
        <h2>Job edit approval requested</h2>
        <p>The employee <strong>{requester_email}</strong> is requesting permission to edit the job posting <strong>{job_title}</strong> on JobNest.</p>
        <p>If you approve, share the following one-time code with them:</p>
        <p style="font-size: 20px; font-weight: bold; letter-spacing: 4px;">{otp_code}</p>
        <p>This code will expire in 10 minutes. If you did not expect this request, you can ignore this email.</p>
        """
        await self._send_email(owner_email, subject, body)

    async def send_connection_request_notification(
        self, to_email: str, requester_name: str
    ) -> None:
        """Notify a user about a new connection request."""
        subject = f"Connection Request from {requester_name}"
        body = f"""
        <h2>New Connection Request</h2>
        <p><strong>{requester_name}</strong> wants to connect with you.</p>
        <p>Log in to Career Canvas to respond.</p>
        """
        await self._send_email(to_email, subject, body)

    async def send_otp_email(self, to_email: str, otp_code: str) -> None:
        """Send a 6-digit OTP code for email verification."""
        subject = "JobNest - Verify your email"
        body = f"""
        <h2>Verify your JobNest account</h2>
        <p>Your one-time verification code is: <strong>{otp_code}</strong></p>
        <p>This code will expire in 10 minutes. If you did not sign up for JobNest, you can safely ignore this email.</p>
        """
        await self._send_email(to_email, subject, body)

    async def send_password_reset_email(self, to_email: str, reset_link: str) -> None:
        """Send a password reset link."""
        subject = "JobNest - Password Reset Request"
        body = f"""
        <h2>Reset your JobNest password</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        """
        await self._send_email(to_email, subject, body)
