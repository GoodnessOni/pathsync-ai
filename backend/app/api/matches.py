"""PathSync AI — Matches Router with Cohere Embeddings"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import cohere
from app.core.database import get_pool
from app.core.config import settings

router = APIRouter()

# Don't initialize here - do it lazily
_cohere_client = None

def get_cohere_client():
    """Lazy initialization of Cohere client."""
    global _cohere_client
    if _cohere_client is None:
        _cohere_client = cohere.Client(settings.COHERE_API_KEY)
    return _cohere_client

class RegenerateRequest(BaseModel):
    user_id: str

@router.post("/regenerate")
async def regenerate_matches(data: RegenerateRequest):
    """
    Regenerate scholarship matches using semantic embeddings.
    """
    pool = await get_pool()
    
    try:
        # 1. Load user profile
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
        
        # 2. Build profile text and generate embedding
        profile_text = _build_profile_text(profile_dict)
        profile_embedding = _generate_embedding(profile_text)
        
        if not profile_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate profile embedding")
        
        # 3. Fetch active scholarships with embeddings
        async with pool.acquire() as conn:
            scholarships = await conn.fetch(
                """SELECT id, title, provider, country, level, description, 
                          eligibility, benefits, amount, deadline, apply_url,
                          documents_needed, duration, embedding
                   FROM scholarships 
                   WHERE (deadline IS NULL OR deadline >= $1)
                   AND embedding IS NOT NULL
                   ORDER BY created_at DESC
                   LIMIT 100""",
                datetime.now().date()
            )
        
        if not scholarships:
            return {"matches": [], "message": "No active scholarships found"}
        
        # 4. Calculate similarity scores
        matches = []
        for scholarship in scholarships:
            s_dict = dict(scholarship)
            
            # Calculate cosine similarity
            similarity = 0.75  # Default
            if s_dict.get('embedding') and profile_embedding:
                async with pool.acquire() as conn:
                    result = await conn.fetchval(
                        "SELECT 1 - ($1::vector <=> $2::vector) as similarity",
                        str(profile_embedding),
                        s_dict['embedding']
                    )
                    similarity = float(result) if result else 0.75
            
            # Apply eligibility filters
            if not _passes_basic_eligibility(s_dict, profile_dict):
                continue
            
            # Only include high-quality matches
            if similarity >= 0.65:
                matches.append({
                    "id": str(s_dict['id']),
                    "title": s_dict['title'],
                    "provider": s_dict['provider'],
                    "description": s_dict.get('description', ''),
                    "amount": s_dict.get('amount'),
                    "deadline": s_dict['deadline'].isoformat() if s_dict.get('deadline') else None,
                    "application_url": s_dict.get('apply_url'),
                    "similarity": round(similarity, 2),
                    "match_reason": _generate_match_reason(s_dict, profile_dict, similarity)
                })
        
        # 5. Sort by similarity and return top 4
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
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


def _build_profile_text(profile: dict) -> str:
    """Build rich profile text for embedding."""
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
        parts.append(f"Projects: {profile['projects']}")
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


def _generate_embedding(text: str) -> list:
    """Generate embedding using Cohere."""
    try:
        co = get_cohere_client()  # Use lazy initialization
        response = co.embed(
            texts=[text[:2000]],
            model='embed-english-v3.0',
            input_type='search_query'
        )
        return response.embeddings[0]
    except Exception as e:
        print(f"Embedding error: {e}")
        return None


def _passes_basic_eligibility(scholarship: dict, profile: dict) -> bool:
    """Basic eligibility checks."""
    level = profile.get('level', '').lower()
    scholarship_level = scholarship.get('level', '').lower()
    
    if 'undergraduate' in scholarship_level or 'bachelor' in scholarship_level:
        if not any(l in level for l in ['100l', '200l', '300l', '400l', '500l']):
            return False
    
    return True


def _generate_match_reason(scholarship: dict, profile: dict, similarity: float) -> str:
    """Generate match reason."""
    reasons = []
    
    if similarity >= 0.90:
        reasons.append("Excellent semantic match")
    elif similarity >= 0.80:
        reasons.append("Strong profile alignment")
    else:
        reasons.append("Good fit for your background")
    
    course = profile.get('course', '').lower()
    description = scholarship.get('description', '').lower()
    
    if 'engineering' in course and 'engineering' in description:
        reasons.append("engineering background valued")
    elif 'computer' in course and ('tech' in description or 'computer' in description):
        reasons.append("tech skills are relevant")
    
    return " — ".join(reasons[:2]) if reasons else "Matches your profile"
