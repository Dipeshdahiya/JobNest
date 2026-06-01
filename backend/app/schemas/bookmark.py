"""Bookmark schemas."""

from pydantic import BaseModel

class BookmarkMessage(BaseModel):
    message: str
