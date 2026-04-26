"""
PathSync AI — Chat API Router
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services.chat_service import discovery_chat, clear_session, extract_skills_from_history
from app.services.rag_service import match_scholarships_for_student
from app.services.pdf_parser import parse_transcript_with_claude

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    message: str


class MatchRequest(BaseModel):
    session_id: str
    top_k: int = 3


@router.post("/message")
async def send_message(req: ChatRequest):
    try:
        result = await discovery_chat(req.session_id, req.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match")
async def get_matches(req: MatchRequest):
    matches = await match_scholarships_for_student(req.session_id, req.top_k)
    return {"matches": matches, "count": len(matches)}


@router.post("/extract-skills")
async def extract_skills(req: MatchRequest):
    skills = await extract_skills_from_history(req.session_id)
    return skills


@router.delete("/session/{session_id}")
async def reset_session(session_id: str):
    await clear_session(session_id)
    return {"message": "Session reset successfully"}


@router.post("/upload-transcript")
async def upload_transcript(session_id: str, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    file_bytes = await file.read()
    result = await parse_transcript_with_claude(file_bytes)
    return result
