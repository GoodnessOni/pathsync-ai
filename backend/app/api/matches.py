"""PathSync AI — Matches Router"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.services.rag_service import generate_embedding_with_claude
from app.core.database import get_pool
from app.core.config import settings
from supabase import create_client

router = APIRouter()

# Initialize Supabase client for auth verification
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class RegenerateRequest(BaseModel):
    user_id: str  # Changed from session_id to user_id

@router.post("/regenerate")
async def regenerate_matches(data: RegenerateRequest):
    """
    Regenerate scholarship matches for a user.
    Returns top 4 best-matching scholarships based on similarity scores.
    """
    pool = await get_pool()
    
    try:
        # 1. Load user profile from student_profiles using user_id
        async with pool.acquire() as conn:
            profile = await conn.fetchrow(
                """SELECT * FROM student_profiles 
                   WHERE user_id = $1
                   LIMIT 1""",
                data.user_id
            )
        
        if not profile:
            raise HTTPException(status_code=404, detail=f"Profile not found for user_id: {data.user_id}")
        
        profile_dict = dict(profile)
        
        # 2. Build profile text for embedding
        profile_text = _build_profile_text_from_onboarding(profile_dict)
        profile_embedding = await generate_embedding_with_claude(profile_text)
        
        # 3. Fetch active scholarships from NaijaOpportunities table
        async with pool.acquire() as conn:
            scholarships = await conn.fetch(
                """SELECT id, title, provider, description, 
                          eligibility_criteria, amount, deadline, 
                          application_url, embedding, min_cgpa, eligible_majors
                   FROM scholarships 
                   WHERE deadline IS NULL OR deadline >= $1
                   ORDER BY created_at DESC
                   LIMIT 50""",
                datetime.now().date()
            )
        
        if not scholarships:
            return {"matches": [], "message": "No active scholarships found"}
        
        # 4. Calculate similarity scores
        matches = []
        for scholarship in scholarships:
            s_dict = dict(scholarship)
            
            similarity = 0.85
            if s_dict.get('embedding') and profile_embedding:
                async with pool.acquire() as conn:
                    result = await conn.fetchval(
                        "SELECT 1 - ($1::vector <=> $2::vector) as similarity",
                        profile_embedding,
                        s_dict['embedding']
                    )
                    similarity = float(result) if result else 0.85
            
            if not _passes_eligibility(s_dict, profile_dict):
                continue
            
            if similarity >= 0.60:
                matches.append({
                    "id": str(s_dict['id']),
                    "title": s_dict['title'],
                    "provider": s_dict['provider'],
                    "description": s_dict.get('description', ''),
                    "amount": s_dict.get('amount'),
                    "deadline": s_dict['deadline'].isoformat() if s_dict.get('deadline') else None,
                    "application_url": s_dict.get('application_url'),
                    "similarity": round(similarity, 2),
                    "match_reason": _generate_match_reason(s_dict, profile_dict, similarity)
                })
        
        # 5. Sort by similarity (best matches first) and return top 4
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {
            "matches": matches[:4],
            "message": f"Found {len(matches[:4])} top matching scholarships"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in regenerate_matches: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error regenerating matches: {str(e)}")


def _build_profile_text_from_onboarding(profile: dict) -> str:
    """Build rich profile text from onboarding data for embedding."""
    parts = []
    
    if profile.get("university"):
        parts.append(f"Student at {profile['university']}")
    if profile.get("course"):
        parts.append(f"Studying {profile['course']}")
    if profile.get("level"):
        parts.append(f"Currently in {profile['level']}")
    if profile.get("cgpa"):
        scale = profile.get("cgpa_scale", "5.0")
        parts.append(f"CGPA {profile['cgpa']} out of {scale}")
    if profile.get("leadership"):
        parts.append(f"Leadership: {profile['leadership']}")
    if profile.get("projects"):
        parts.append(f"Projects and activities: {profile['projects']}")
    if profile.get("demographics"):
        parts.append(f"Background: {', '.join(profile['demographics'])}")
    if profile.get("about"):
        parts.append(f"About: {profile['about']}")
    if profile.get("goal"):
        goal_map = {
            "fund_education": "seeking funding for education",
            "study_abroad": "interested in studying abroad",
            "build_career": "focused on career development"
        }
        parts.append(goal_map.get(profile['goal'], profile['goal']))
    
    return ". ".join(parts)


def _passes_eligibility(scholarship: dict, profile: dict) -> bool:
    """Check if student meets hard eligibility requirements."""
    
    if scholarship.get("min_cgpa") and profile.get("cgpa"):
        student_cgpa = float(profile['cgpa'])
        cgpa_scale = float(profile.get('cgpa_scale', '5.0'))
        
        if cgpa_scale == 4.0:
            student_cgpa = (student_cgpa / 4.0) * 5.0
        
        if student_cgpa < float(scholarship['min_cgpa']):
            return False
    
    if scholarship.get("eligible_majors") and profile.get("course"):
        eligible_majors = scholarship['eligible_majors']
        if eligible_majors and len(eligible_majors) > 0:
            student_course = profile['course'].lower()
            if not any(major.lower() in student_course or student_course in major.lower() 
                      for major in eligible_majors):
                if "all" not in str(eligible_majors).lower():
                    return False
    
    return True


def _generate_match_reason(scholarship: dict, profile: dict, similarity: float) -> str:
    """Generate a simple match reason based on profile and scholarship."""
    reasons = []
    
    if similarity >= 0.90:
        reasons.append("Excellent profile match")
    elif similarity >= 0.80:
        reasons.append("Strong profile alignment")
    else:
        reasons.append("Good fit for your profile")
    
    if profile.get("cgpa") and scholarship.get("min_cgpa"):
        if float(profile['cgpa']) >= float(scholarship['min_cgpa']) + 0.5:
            reasons.append("your CGPA exceeds requirements")
    
    if profile.get("leadership"):
        if "leadership" in scholarship.get("eligibility_criteria", "").lower():
            reasons.append("your leadership experience is valued")
    
    if profile.get("course") and scholarship.get("eligible_majors"):
        if any(profile['course'].lower() in major.lower() 
               for major in scholarship.get("eligible_majors", [])):
            reasons.append("your course is specifically eligible")
    
    return " — ".join(reasons[:2]) if reasons else "Matches your profile"
