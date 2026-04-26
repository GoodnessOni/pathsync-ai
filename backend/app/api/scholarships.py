"""PathSync AI — Scholarships Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.services.rag_service import ingest_scholarship

router = APIRouter()

class ScholarshipCreate(BaseModel):
    title: str
    provider: str
    description: str
    eligibility_criteria: str
    min_cgpa: Optional[float] = None
    eligible_majors: Optional[List[str]] = []
    amount: Optional[str] = None
    deadline: Optional[date] = None
    application_url: Optional[str] = None

@router.post("/ingest")
async def ingest(data: ScholarshipCreate):
    scholarship_id = await ingest_scholarship(data.dict())
    return {"id": scholarship_id, "message": "Scholarship ingested and embedded successfully"}
