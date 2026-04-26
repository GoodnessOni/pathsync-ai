"""
PathSync AI — PHASE 3: Cost & Performance Optimization
Demonstrates prompt caching and model tiering strategy.
"""
import anthropic
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# ════════════════════════════════════════════════════════════════════════════
# PROMPT CACHING — Reduces costs by ~90% for returning students
#
# How it works:
#   - Claude caches the system prompt + static context (scholarships list)
#   - On repeated calls, only NEW user messages are billed at full rate
#   - The cached prefix is billed at 10% of normal input token price
#   - Cache persists for 5 minutes (refreshed on each use)
#
# When to use:
#   - System prompts > 1024 tokens ← minimum cacheable block size
#   - Static scholarship data loaded into context
#   - Returning students picking up their session
# ════════════════════════════════════════════════════════════════════════════

CACHED_SCHOLARSHIP_CONTEXT = """
You are PathSync AI. Below is the complete scholarship database for this session.
Use this to match students accurately.

--- SCHOLARSHIP DATABASE ---
1. MTN Foundation STEM Scholarship
   Provider: MTN Nigeria | Amount: ₦200,000/yr
   Eligibility: 200L–400L, CGPA ≥ 3.5/5.0, STEM fields
   Deadline: July 31

2. Shell Nigeria University Scholarship
   Provider: Shell | Amount: ₦500,000/yr
   Eligibility: 2nd Class Upper+, Engineering disciplines
   Deadline: June 30

3. NLNG National Postgraduate Scholarship
   Provider: Nigeria LNG | Amount: ₦2,000,000/yr
   Eligibility: First class only, postgrad studies
   Deadline: September 15

4. TETFund Academic Staff Development
   Provider: TETFund | Amount: Full tuition + stipend
   Eligibility: Academic staff at federal/state institutions

[Add more scholarships here — this entire block is cached]
--- END DATABASE ---
"""


async def cached_chat_with_returning_student(
    session_messages: list,
    new_user_message: str,
) -> dict:
    """
    Chat using prompt caching for returning students.
    The system prompt + scholarship database are cached — only charged once per 5 min window.
    """
    response = client.messages.create(
        model="claude-sonnet-4-20250514",   # Sonnet supports caching
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": CACHED_SCHOLARSHIP_CONTEXT,
                "cache_control": {"type": "ephemeral"},  # ← CACHE THIS BLOCK
            }
        ],
        messages=[
            # Historical messages (also cacheable if long)
            *[
                {**msg, "cache_control": {"type": "ephemeral"}}
                if i == len(session_messages) - 1  # Cache up to last message
                else msg
                for i, msg in enumerate(session_messages)
            ],
            # New message — NOT cached (billed at full rate)
            {"role": "user", "content": new_user_message},
        ],
    )

    usage = response.usage
    cache_savings = getattr(usage, "cache_read_input_tokens", 0)

    return {
        "response": response.content[0].text,
        "tokens": {
            "input": usage.input_tokens,
            "output": usage.output_tokens,
            "cache_read": cache_savings,
            "cache_write": getattr(usage, "cache_creation_input_tokens", 0),
        },
        "cost_saved_tokens": cache_savings,
    }


# ════════════════════════════════════════════════════════════════════════════
# MODEL TIERING — When to use Haiku vs Sonnet
#
# ┌─────────────────────────────────┬──────────────────┬──────────────────┐
# │ Task                            │ Model            │ Reason           │
# ├─────────────────────────────────┼──────────────────┼──────────────────┤
# │ Discovery chat turns            │ claude-haiku-4-5 │ Speed + low cost │
# │ Quick skill extraction          │ claude-haiku-4-5 │ Simple JSON task │
# │ Scholarship match explanation   │ claude-haiku-4-5 │ 1-sentence reply │
# │ PDF transcript parsing          │ claude-sonnet-4  │ Complex structure│
# │ Full profile synthesis          │ claude-sonnet-4  │ Nuanced reasoning│
# │ First-time session (cold start) │ claude-sonnet-4  │ Best first impr. │
# └─────────────────────────────────┴──────────────────┴──────────────────┘
#
# Cost estimate for 1,000 students/day:
#   - Haiku:  ~5 turns × 800 tokens × 1000 students = $0.40/day
#   - Sonnet: ~1 parse  × 4000 tokens × 1000 students = $12.00/day
#   - With caching on returning students: ~60% reduction overall
# ════════════════════════════════════════════════════════════════════════════

MODEL_ROUTER = {
    "chat_turn":            "claude-haiku-4-5-20251001",
    "skill_extraction":     "claude-haiku-4-5-20251001",
    "match_explanation":    "claude-haiku-4-5-20251001",
    "transcript_parsing":   "claude-sonnet-4-20250514",
    "profile_synthesis":    "claude-sonnet-4-20250514",
    "cold_start_greeting":  "claude-sonnet-4-20250514",
}


def get_model(task: str) -> str:
    """Route to cheapest model capable of the task."""
    return MODEL_ROUTER.get(task, "claude-haiku-4-5-20251001")
