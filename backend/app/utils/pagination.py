"""Reusable pagination dependency."""

from fastapi import Query


class PaginationParams:
    """Dependency that extracts skip/limit query parameters.

    Usage::

        @router.get("/items")
        async def list_items(pagination: PaginationParams = Depends()):
            ...
    """

    def __init__(
        self,
        skip: int = Query(default=0, ge=0, description="Records to skip"),
        limit: int = Query(default=20, ge=1, le=100, description="Max records to return"),
    ) -> None:
        self.skip = skip
        self.limit = limit
