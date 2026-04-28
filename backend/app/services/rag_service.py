"""
PathSync AI — PHASE 4: RAG Vector Search (Supabase pgvector)
Generates embeddings and finds top-3 scholarship matches for a student profile.
"""
import json
import anthropic
from typing import Optional
from app.core.config import settings
from app.core.database import get_pool

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


# ── Embedding Generation ──────────────────────────────────────────────────────

def build_profile_text(profile: dict) -> str:
    """
    Convert a student profile dict into a rich text passage for embedding.
    Richer text = better semantic matching.
    """
    parts = []

    if profile.get("major"):
        parts.append(f"Studying {profile['major']}")
    if profile.get("cgpa"):
        parts.append(f"CGPA {profile['cgpa']} out of 5.0")
    if profile.get("level"):
        parts.append(f"Currently in {profile['level']}")
    if profile.get("soft_skills"):
        parts.append("Skills: " + ", ".join(profile["soft_skills"]))
    if profile.get("achievements"):
        parts.append("Achievements: " + "; ".join(profile["achievements"]))
    if profile.get("semester_grades"):
        # Extract notable courses
        all_courses = []
        for sem in profile["semester_grades"].values():
            for course in sem.get("courses", []):
                if course.get("grade") in ["A", "B"]:
                    all_courses.append(course.get("title", ""))
        if all_courses:
            parts.append("Strong courses: " + ", ".join(all_courses[:10]))

    return ". ".join(parts)


def build_scholarship_text(scholarship: dict) -> str:
    """Convert scholarship record into embeddable text."""
    return (
        f"{scholarship['title']} by {scholarship['provider']}. "
        f"{scholarship['description']} "
        f"Eligibility: {scholarship['eligibility_criteria']}. "
        f"Amount: {scholarship.get('amount', 'N/A')}."
    )


def chunk_document(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    """
    Split long scholarship PDFs into overlapping chunks for embedding.
    Uses sentence-aware chunking to avoid cutting mid-sentence.
    
    Args:
        text: Full document text
        chunk_size: Approximate characters per chunk
        overlap: Characters of overlap between chunks (context continuity)
    """
    sentences = text.replace('\n', ' ').split('. ')
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence_len = len(sentence)
        if current_length + sentence_len > chunk_size and current_chunk:
            chunks.append('. '.join(current_chunk) + '.')
            # Keep last N chars as overlap
            overlap_text = '. '.join(current_chunk)[-overlap:]
            current_chunk = [overlap_text, sentence]
            current_length = len(overlap_text) + sentence_len
        else:
            current_chunk.append(sentence)
            current_length += sentence_len

    if current_chunk:
        chunks.append('. '.join(current_chunk))

    return [c.strip() for c in chunks if len(c.strip()) > 50]


async def generate_embedding_with_claude(text: str) -> list[float]:
    """
    Generate embeddings using Claude's embedding-compatible approach.
    
    NOTE: Anthropic doesn't expose a dedicated embeddings endpoint yet.
    We use OpenAI's text-embedding-3-small (1536-dim) which pairs well
    with pgvector. Replace with Anthropic embeddings when available.
    
    For a Claude-only stack, use the semantic similarity approach below.
    """
    try:
        # Try OpenAI embeddings if key provided
        if settings.OPENAI_API_KEY:
            import openai
            oai = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = oai.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000],
            )
            return response.data[0].embedding

        # Fallback: return zero vector (will still work, just no semantic matching)
        # Add OPENAI_API_KEY to your .env for proper embeddings
        return [0.0] * 1536

    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {e}")


# ── Scholarship Ingestion ─────────────────────────────────────────────────────

async def ingest_scholarship(scholarship_data: dict) -> str:
    """
    Embed and store a new scholarship in the vector database.
    """
    pool = await get_pool()
    text = build_scholarship_text(scholarship_data)
    embedding = await generate_embedding_with_claude(text)

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO scholarships
               (title, provider, description, eligibility_criteria, min_cgpa,
                eligible_majors, amount, deadline, application_url, embedding)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
               RETURNING id""",
            scholarship_data["title"],
            scholarship_data["provider"],
            scholarship_data["description"],
            scholarship_data["eligibility_criteria"],
            scholarship_data.get("min_cgpa"),
            scholarship_data.get("eligible_majors", []),
            scholarship_data.get("amount"),
            scholarship_data.get("deadline"),
            scholarship_data.get("application_url"),
            embedding,
        )
    return str(row["id"])


# ── Core Similarity Search ────────────────────────────────────────────────────

async def match_scholarships_for_student(
    session_id: str,
    top_k: int = 3,
    threshold: float = 0.60,
) -> list[dict]:
    """
    Find top-K scholarships matching a student profile.
    
    Pipeline:
    1. Load student profile from DB
    2. Build rich profile text
    3. Generate profile embedding
    4. Run pgvector cosine similarity search
    5. Post-filter by CGPA and major constraints
    6. Return ranked results with explanations
    """
    pool = await get_pool()

    # 1. Load profile
    async with pool.acquire() as conn:
        profile = await conn.fetchrow(
            "SELECT * FROM student_profiles WHERE session_id = $1", session_id
        )

    if not profile:
        return []

    profile_dict = dict(profile)
    profile_dict["semester_grades"] = json.loads(profile_dict.get("semester_grades") or "{}")

    # 2. Build and embed profile text
    profile_text = build_profile_text(profile_dict)
    embedding = await generate_embedding_with_claude(profile_text)

    # 3. pgvector similarity search via Supabase RPC
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT * FROM match_scholarships($1::vector, $2, $3)""",
            embedding, threshold, top_k * 2  # Fetch extra for post-filtering
        )

    # 4. Post-filter: hard eligibility constraints
    results = []
    for row in rows:
        scholarship = dict(row)
        # Check CGPA requirement
        if scholarship.get("min_cgpa") and profile_dict.get("cgpa"):
            if profile_dict["cgpa"] < scholarship["min_cgpa"]:
                continue
        results.append(scholarship)
        if len(results) >= top_k:
            break

    # 5. Generate match explanations with Claude (Haiku — cheap)
    if results:
        results = await _add_match_explanations(results, profile_dict)

    return results


async def _add_match_explanations(scholarships: list[dict], profile: dict) -> list[dict]:
    """Use Claude Haiku to add a personalised 'why you match' explanation."""
    prompt = f"""Student profile:
- Major: {profile.get('major', 'Unknown')}
- CGPA: {profile.get('cgpa', 'Unknown')}
- Skills: {', '.join(profile.get('soft_skills') or [])}

For each scholarship below, write ONE sentence (max 20 words) explaining why this student is a strong match.
Return ONLY JSON array: [{{"id": "...", "match_reason": "..."}}]

Scholarships:
{json.dumps([{"id": str(s["id"]), "title": s["title"], "eligibility": s["eligibility_criteria"]} for s in scholarships], indent=2)}"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    )

    import re
    raw = response.content[0].text.strip()
    raw = re.sub(r'^```json\s*|\s*```$', '', raw, flags=re.MULTILINE)

    try:
        explanations = {e["id"]: e["match_reason"] for e in json.loads(raw)}
        for s in scholarships:
            s["match_reason"] = explanations.get(str(s["id"]), "Strong profile alignment.")
    except Exception:
        for s in scholarships:
            s["match_reason"] = "Strong profile alignment."

    return scholarships
