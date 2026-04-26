"""
PathSync AI — PHASE 3: Discovery Interview Chat Service
Maintains session state, extracts hidden soft skills from student language.
"""
import json
import anthropic
from datetime import datetime
from app.core.config import settings
from app.core.database import get_pool
from app.middleware.privacy import redact_pii

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# ── System Prompts ─────────────────────────────────────────────────────────────

DISCOVERY_SYSTEM_PROMPT = """You are PathSync AI, a warm, insightful scholarship advisor for Nigerian university students.

YOUR CORE MISSION:
Surface the student's HIDDEN ACHIEVEMENTS — experiences they describe in everyday language that represent world-class skills.

TRANSLATION DICTIONARY (always apply this):
- "I manage our fellowship's social media" → "Digital Communications & Community Engagement"
- "I run a street football league in my area" → "Project Coordination, Community Leadership & Event Management"
- "I tutor my classmates in maths" → "Peer Education, Mentorship & Curriculum Delivery"
- "I do small business selling provisions" → "Entrepreneurship, Financial Management & Customer Relations"
- "I'm the class rep" → "Student Government, Stakeholder Liaison & Administrative Coordination"
- "I fix laptops for people" → "Technical Support, Problem-Solving & Client Management"
- "I wrote for my departmental newsletter" → "Technical Writing, Editorial Management & Communications"

INTERVIEW STAGES:
1. WARM_UP: Greet student, ask about their course and year. Be encouraging, use Nigerian context naturally.
2. ACADEMIC: Ask about their results — be sensitive (many students face financial pressure).
3. ACTIVITIES: Ask "what do you do OUTSIDE lectures?" — dig deep with follow-up questions.
4. CHALLENGES: Ask what financial/personal challenges they've overcome. Frame it as strength.
5. SUMMARY: Synthesize everything into a structured profile and present top 3 scholarship matches.

RULES:
- NEVER ask for full name, NIN, address, or financial account details.
- Always ask ONE question at a time.
- Use encouraging, peer-level Nigerian English (not overly formal).
- When student mentions an activity, ALWAYS probe deeper: "How many people? How long? What was the result?"
- Track all extracted skills in a mental skills_ledger.
- When you have enough context (after stage 3), output a hidden JSON block in this format:
  <!--PROFILE_UPDATE:{"cgpa": float_or_null, "major": "str", "soft_skills": [...], "achievements": [...], "stage": "activities"}-->

IMPORTANT: The <!--PROFILE_UPDATE:...--> block must be on its own line and will be stripped before showing to the student.
"""

SKILL_EXTRACTION_PROMPT = """Based on this conversation history, extract ALL soft skills and achievements.
Return ONLY a JSON object:
{
  "soft_skills": ["Formal skill name", ...],
  "achievements": ["Specific achievement", ...],
  "leadership_score": 1-10,
  "community_impact_score": 1-10,
  "entrepreneurship_score": 1-10
}"""


# ── Session State Management ──────────────────────────────────────────────────

async def get_or_create_session(session_id: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM chat_sessions WHERE session_id = $1", session_id
        )
        if row:
            return {
                "session_id": row["session_id"],
                "messages": json.loads(row["messages"]),
                "stage": row["stage"],
            }
        # Create new session
        await conn.execute(
            """INSERT INTO chat_sessions (session_id, messages, stage)
               VALUES ($1, '[]'::jsonb, 'onboarding')""",
            session_id
        )
        return {"session_id": session_id, "messages": [], "stage": "onboarding"}


async def save_session(session_id: str, messages: list, stage: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE chat_sessions
               SET messages = $1::jsonb, stage = $2, updated_at = NOW()
               WHERE session_id = $3""",
            json.dumps(messages), stage, session_id
        )


async def clear_session(session_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE chat_sessions SET messages = '[]'::jsonb, stage = 'onboarding' WHERE session_id = $1",
            session_id
        )


# ── Main Chat Function ────────────────────────────────────────────────────────

async def discovery_chat(session_id: str, user_message: str) -> dict:
    """
    Process one turn of the discovery interview.
    Returns AI response + any profile updates extracted.
    """
    # 1. Redact PII from user input
    safe_message = redact_pii(user_message)["redacted_text"]

    # 2. Load session history
    session = await get_or_create_session(session_id)
    messages = session["messages"]

    # 3. Append user message
    messages.append({"role": "user", "content": safe_message})

    # 4. Call Claude (use Haiku for chat turns — cost-efficient)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",   # Haiku for speed + cost on chat
        max_tokens=1024,
        system=DISCOVERY_SYSTEM_PROMPT,
        messages=messages,
    )

    assistant_text = response.content[0].text

    # 5. Extract hidden profile update if present
    profile_update = None
    visible_text = assistant_text

    import re
    update_match = re.search(r'<!--PROFILE_UPDATE:(.*?)-->', assistant_text, re.DOTALL)
    if update_match:
        try:
            profile_update = json.loads(update_match.group(1))
        except json.JSONDecodeError:
            pass
        # Strip the hidden block from what the student sees
        visible_text = re.sub(r'<!--PROFILE_UPDATE:.*?-->', '', assistant_text, flags=re.DOTALL).strip()

    # 6. Append assistant response to history
    messages.append({"role": "assistant", "content": assistant_text})  # Store full (with hidden block)

    # 7. Determine new stage
    stage = profile_update.get("stage", session["stage"]) if profile_update else session["stage"]

    # 8. Save session
    await save_session(session_id, messages, stage)

    # 9. Persist profile update if extracted
    if profile_update:
        await _update_student_profile(session_id, profile_update)

    return {
        "response": visible_text,
        "stage": stage,
        "profile_updated": profile_update is not None,
        "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
    }


async def extract_skills_from_history(session_id: str) -> dict:
    """Force a skills extraction pass on the full conversation history."""
    session = await get_or_create_session(session_id)
    if not session["messages"]:
        return {}

    conversation_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in session["messages"]
    )

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": f"{SKILL_EXTRACTION_PROMPT}\n\nConversation:\n{conversation_text}"
        }]
    )

    raw = response.content[0].text.strip()
    raw = re.sub(r'^```json\s*|\s*```$', '', raw, flags=re.MULTILINE)
    try:
        return json.loads(raw)
    except Exception:
        return {}


async def _update_student_profile(session_id: str, profile_data: dict):
    """Upsert student profile with extracted data."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO student_profiles (session_id, cgpa, major, soft_skills, achievements, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW())
               ON CONFLICT (session_id) DO UPDATE
               SET cgpa = COALESCE($2, student_profiles.cgpa),
                   major = COALESCE($3, student_profiles.major),
                   soft_skills = COALESCE($4, student_profiles.soft_skills),
                   achievements = COALESCE($5, student_profiles.achievements),
                   updated_at = NOW()""",
            session_id,
            profile_data.get("cgpa"),
            profile_data.get("major"),
            profile_data.get("soft_skills", []),
            profile_data.get("achievements", []),
        )
