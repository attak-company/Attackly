from fastapi import APIRouter
from app.api import line

router = APIRouter()

router.include_router(line.router, prefix="/line", tags=["line"])
