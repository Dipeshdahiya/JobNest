"""Project-wide constants."""

# File upload limits (bytes)
MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Pagination defaults
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Cloudinary folders
CLOUDINARY_AVATAR_FOLDER = "career_canvas/avatars"
CLOUDINARY_RESUME_FOLDER = "career_canvas/resumes"
CLOUDINARY_POST_MEDIA_FOLDER = "career_canvas/posts"
