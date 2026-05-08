"""PathSync AI — Matches Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.services.rag_service import generate_embedding_with_claude
from app.core.database import get_pool

router = APIRouter()

class RegenerateRequest(BaseModel):
    session_id: str

@router.post("/regenerate")
async def regenerate_matches(data: RegenerateRequest):
    """
    Regenerate scholarship matches for a user.
    Fetches fresh scholarships from NaijaOpportunities and matches against user profile.
    """
    pool = await get_pool()
    
    try:
        # 1. Load user profile from student_profiles
        async with pool.acquire() as conn:
            profile = await conn.fetchrow(
                """SELECT * FROM student_profiles 
                   WHERE session_id = $1 OR user_id = (
                       SELECT user_id FROM student_profiles WHERE session_id = $1
                   )
                   LIMIT 1""",
                data.session_id
            )
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_dict = dict(profile)
        
        # 2. Build profile text for embedding
        profile_text = _build_profile_text_from_onboarding(profile_dict)
        profile_embedding = await generate_embedding_with_claude(profile_text)
        
        # 3. Fetch active scholarships from NaijaOpportunities table
        # Filter: deadline >= today
        async with pool.acquire() as conn:
            scholarships = await conn.fetch(
                """SELECT id, title, provider, description, 
                          eligibility_criteria, amount, deadline, 
                          application_url, embedding
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
            
            # Calculate cosine similarity if embeddings exist
            similarity = 0.85  # Default similarity
            if s_dict.get('embedding') and profile_embedding:
                # Cosine similarity: 1 - cosine_distance
                async with pool.acquire() as conn:
                    result = await conn.fetchval(
                        "SELECT 1 - ($1::vector <=> $2::vector) as similarity",
                        profile_embedding,
                        s_dict['embedding']
                    )
                    similarity = float(result) if result else 0.85
            
            # 5. Apply hard filters (CGPA, major, etc.)
            if not _passes_eligibility(s_dict, profile_dict):
                continue
            
            # 6. Add to matches if similarity is high enough
            if similarity >= 0.60:  # Threshold
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
        
        # 7. Sort by similarity and return top matches
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {
            "matches": matches[:10],  # Return top 10 matches
            "message": f"Found {len(matches)} matching scholarships"
        }
        
    except Exception as e:
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
    
    # Check CGPA requirement
    if scholarship.get("min_cgpa") and profile.get("cgpa"):
        # Normalize CGPA to 5.0 scale
        student_cgpa = float(profile['cgpa'])
        cgpa_scale = float(profile.get('cgpa_scale', '5.0'))
        
        if cgpa_scale == 4.0:
            student_cgpa = (student_cgpa / 4.0) * 5.0
        
        if student_cgpa < float(scholarship['min_cgpa']):
            return False
    
    # Check major/course eligibility
    if scholarship.get("eligible_majors") and profile.get("course"):
        eligible_majors = scholarship['eligible_majors']
        if eligible_majors and len(eligible_majors) > 0:
            # Check if student's course matches any eligible major
            student_course = profile['course'].lower()
            if not any(major.lower() in student_course or student_course in major.lower() 
                      for major in eligible_majors):
                # Allow "All disciplines" or empty list
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
