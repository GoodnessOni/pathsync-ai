from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.generation_service import (
    generate_application_letter,
    generate_cv,
    generate_deadline_tracker,
)
from app.services.rag_service import match_scholarships_for_student

router = APIRouter()


class GenerateLetterRequest(BaseModel):
    session_id: str
    scholarship_title: str
    scholarship_provider: str


class GenerateCVRequest(BaseModel):
    session_id: str
    profile_context: Optional[str] = None


class TrackerRequest(BaseModel):
    session_id: str
    matches_context: Optional[List[dict]] = None


@router.post("/letter")
async def application_letter(req: GenerateLetterRequest):
    try:
        letter = await generate_application_letter(
            req.session_id, req.scholarship_title, req.scholarship_provider
        )
        return {"letter": letter}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cv")
async def cv(req: GenerateCVRequest):
    try:
        cv_text = await generate_cv(req.session_id, req.profile_context)
        return {"cv": cv_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tracker")
async def tracker(req: TrackerRequest):
    try:
        matches = await match_scholarships_for_student(req.session_id, top_k=3)
        if not matches and not req.matches_context:
            matches = [
                {"title": "MTN Foundation Scholarship", "provider": "MTN Nigeria", "deadline": "2026-07-31", "eligibility_criteria": "STEM students"},
                {"title": "Shell Nigeria Scholarship", "provider": "Shell Nigeria", "deadline": "2026-06-30", "eligibility_criteria": "Engineering students"},
            ]
        tracker_data = await generate_deadline_tracker(
            req.session_id, matches, req.matches_context
        )
        return {"tracker": tracker_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))