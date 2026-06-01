# Re-export all models so Alembic autogenerate discovers them
from app.models.user import User  # noqa: F401
from app.models.profile import (  # noqa: F401
    SeekerProfile,
    EmployerProfile,
    Experience,
    EducationEntry,
    Certification,
    Language,
)
from app.models.job import Skill, Job  # noqa: F401
from app.models.application import Application  # noqa: F401
from app.models.social import Post, Comment, Like, Hashtag  # noqa: F401
from app.models.messaging import Message  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.connection import Connection  # noqa: F401
from app.models.report import Report  # noqa: F401
