"""PathSync AI — Health Check"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "service": "PathSync AI", "version": "1.0.0"}
