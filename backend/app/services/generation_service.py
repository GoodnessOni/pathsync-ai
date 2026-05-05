"""
PathSync AI — Generation Service
"""
import json
import re
import anthropic
from app.core.config import settings
from app.core.database import get_pool

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


async def get_profile_and_history(session_id: str) -> dict:
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            profile = await conn.fetchrow(
                "SELECT * FROM student_profiles WHERE session_id = $1", session_id
            )
            session = await conn.fetchrow(
                "SELECT messages FROM chat_sessions WHERE session_id = $1", session_id
            )
        profile_dict = dict(profile) if profile else {}
        messages = json.loads(session["messages"]) if session else []
        conversation = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages[-20:]
        )
        return {"profile": profile_dict, "conversation": conversation}
    except Exception:
        return {"profile": {}, "conversation": ""}


async def generate_application_letter(
    session_id: str,
    scholarship_title: str,
    scholarship_provider: str,
    profile_context: str = None
) -> str:
    data = await get_profile_and_history(session_id)
    profile = data["profile"]
    conversation = data["conversation"]

    profile_summary = profile_context or f"""
- CGPA: {profile.get('cgpa', 'Not specified')}
- Major: {profile.get('major', 'Not specified')}
- Level: {profile.get('level', 'Not specified')}
- Skills: {', '.join(profile.get('soft_skills') or [])}
- Achievements: {', '.join(profile.get('achievements') or [])}
"""

    prompt = f"""You are an expert scholarship application writer for Nigerian university students.

Write a compelling formal scholarship application letter.

STUDENT PROFILE:
{profile_summary}

CONVERSATION CONTEXT (extract activities and achievements):
{conversation[:3000] if conversation else "Not available"}

SCHOLARSHIP: {scholarship_title} by {scholarship_provider}

Write a 3-paragraph formal application letter:
1. Opening: Who they are, what they're applying for, strong hook
2. Body: Academic excellence + hidden achievements translated into formal competencies
3. Closing: Why they deserve this scholarship, future impact

Start with "Dear Scholarship Committee,"
Sign off as "A Dedicated Nigerian Student"
Maximum 350 words. No placeholder brackets."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text


async def generate_cv(session_id: str, profile_context: str = None) -> str:
    data = await get_profile_and_history(session_id)
    profile = data["profile"]
    conversation = data["conversation"]

    profile_summary = profile_context or f"""
- CGPA: {profile.get('cgpa', 'Not specified')}
- Major: {profile.get('major', 'Not specified')}
- Level: {profile.get('level', 'Not specified')}
- Skills: {', '.join(profile.get('soft_skills') or [])}
- Achievements: {', '.join(profile.get('achievements') or [])}
"""

    prompt = f"""You are an expert CV writer for Nigerian university students applying for scholarships.

Generate a complete scholarship-optimised CV.

STUDENT PROFILE:
{profile_summary}

CONVERSATION CONTEXT:
{conversation[:3000] if conversation else "Not available"}

Generate a complete CV with these sections:
1. OBJECTIVE — 2 sentences, scholarship-focused
2. EDUCATION — University, course, CGPA, expected graduation
3. SKILLS & COMPETENCIES — Formal competency names translated from activities
4. LEADERSHIP & COMMUNITY — Roles, clubs, community work mentioned
5. ACHIEVEMENTS & AWARDS — Academic and extracurricular
6. REFEREES — Available on request

Rules:
- Translate EVERY informal activity into a proper CV line
- Make it professional and ATS-friendly
- Do NOT use placeholder brackets like [Name]
- Sign off with "Nigerian Student" as name placeholder"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text


async def generate_deadline_tracker(
    session_id: str,
    matches: list,
    matches_context: list = None
) -> list:
    data = await get_profile_and_history(session_id)
    profile = data["profile"]

    scholarships_data = matches_context or [
        {
            "title": m.get("title"),
            "provider": m.get("provider"),
            "deadline": str(m.get("deadline", "TBC")),
            "eligibility": m.get("eligibility_criteria", "")
        }
        for m in (matches or [])
    ]

    if not scholarships_data:
        return []

    prompt = f"""You are a scholarship application advisor for Nigerian students.

For each scholarship below, create a detailed action plan.

STUDENT: {profile.get('major', 'Nigerian student')}, {profile.get('cgpa', '')} CGPA

SCHOLARSHIPS:
{json.dumps(scholarships_data, indent=2)}

Return ONLY a valid JSON array. No markdown. No explanation.
Each object must have:
- title: string
- provider: string  
- deadline: string
- days_left: number (assume today is May 2026)
- urgency: "urgent" | "moderate" | "comfortable"
- steps: array of 5 specific action step strings
- documents_needed: array of document name strings
- tip: one specific insider tip string"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    raw = re.sub(r'^```json\s*|\s*```$', '', raw, flags=re.MULTILINE)
    try:
        return json.loads(raw)
    except Exception:
        return []