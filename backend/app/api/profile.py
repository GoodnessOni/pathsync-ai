"""PathSync AI — Profile Router"""
from fastapi import APIRouter, HTTPException
from app.core.database import get_pool

router = APIRouter()

@router.get("/{session_id}")
async def get_profile(session_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM student_profiles WHERE session_id = $1", session_id
        )
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return dict(row)
