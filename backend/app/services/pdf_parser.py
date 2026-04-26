"""
PathSync AI — PHASE 2: Multi-Modal PDF Parser
Extracts transcript data using pdfplumber, then structures it with Claude.
"""
import json
import re
import anthropic
import pdfplumber
from io import BytesIO
from app.core.config import settings
from app.middleware.privacy import redact_pii

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


# ── Step 1: Raw PDF text extraction ──────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract raw text from a transcript PDF using pdfplumber.
    Handles multi-column layouts typical of Nigerian university transcripts.
    """
    full_text = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            # Extract tables first (grade tables are structured)
            tables = page.extract_tables()
            for table in tables:
                if table:
                    for row in table:
                        clean_row = [cell.strip() if cell else "" for cell in row]
                        full_text.append(" | ".join(clean_row))

            # Extract remaining text
            page_text = page.extract_text(x_tolerance=2, y_tolerance=2)
            if page_text:
                full_text.append(f"--- Page {page_num} ---\n{page_text}")

    return "\n".join(full_text)


# ── Step 2: Claude prompt to structure the transcript ────────────────────────
TRANSCRIPT_SYSTEM_PROMPT = """You are an academic data extraction specialist.
Your job is to parse raw Nigerian university transcript text and return ONLY a valid JSON object.
No explanations, no markdown fences — pure JSON only.

Nigerian grading context:
- CGPA is typically on a 5.0 scale (UNILAG, UNIABUJA, etc.) or 4.0 scale (some private unis)
- Grade points: A=5, B=4, C=3, D=2, E=1, F=0 (5.0 scale)
- Honours: First Class ≥4.50, Second Class Upper ≥3.50, Second Class Lower ≥2.40

Return this exact JSON schema:
{
  "cgpa": float,
  "scale": "5.0 or 4.0",
  "honours_class": "First Class | Second Class Upper | Second Class Lower | Third Class | Pass",
  "major": "string",
  "faculty": "string",
  "level": "string (e.g. 400L)",
  "total_units": integer,
  "semesters": [
    {
      "name": "string (e.g. 100L First Semester)",
      "gpa": float,
      "courses": [
        {
          "code": "string",
          "title": "string",
          "units": integer,
          "grade": "string",
          "grade_point": float
        }
      ]
    }
  ],
  "notable_achievements": ["strings — Dean's List, Best Graduating Student, etc."]
}"""


async def parse_transcript_with_claude(file_bytes: bytes) -> dict:
    """
    Full pipeline: extract PDF text → redact PII → send to Claude → return structured JSON.
    """
    # 1. Extract raw text
    raw_text = extract_text_from_pdf(file_bytes)

    # 2. Redact PII before sending to LLM
    redaction_result = redact_pii(raw_text)
    safe_text = redaction_result["redacted_text"]

    # 3. Call Claude (Sonnet for accuracy on complex parsing)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=TRANSCRIPT_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Parse this transcript:\n\n{safe_text[:12000]}"  # Stay within context
            }
        ],
    )

    # 4. Parse response
    raw_response = message.content[0].text.strip()

    # Strip any accidental markdown fences
    raw_response = re.sub(r'^```json\s*|\s*```$', '', raw_response, flags=re.MULTILINE)

    try:
        structured = json.loads(raw_response)
    except json.JSONDecodeError:
        # Attempt recovery
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        structured = json.loads(match.group(0)) if match else {"error": "Parse failed", "raw": raw_response}

    return {
        "structured_transcript": structured,
        "pii_redacted": redaction_result["pii_found"],
        "tokens_used": message.usage.input_tokens + message.usage.output_tokens,
    }
