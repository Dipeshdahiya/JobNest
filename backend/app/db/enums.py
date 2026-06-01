"""Enum definitions for the database schema."""

import enum


class UserRole(str, enum.Enum):
    SEEKER = "seeker"
    EMPLOYER = "employer"
    ADMIN = "admin"


class ProfileVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class JobStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ExperienceLevel(str, enum.Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"


class JobType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"


class ConnectionStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class NotificationType(str, enum.Enum):
    JOB_ALERT = "job_alert"
    MESSAGE = "message"
    APPLICATION_UPDATE = "application_update"
    POST_INTERACTION = "post_interaction"
    CONNECTION_REQUEST = "connection_request"


class ReportTargetType(str, enum.Enum):
    USER = "user"
    JOB = "job"
    POST = "post"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
