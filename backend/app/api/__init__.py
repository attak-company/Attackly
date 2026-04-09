from fastapi import APIRouter
from app.api import line, auth

router = APIRouter()

router.include_router(line.router, prefix="/line", tags=["line"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
