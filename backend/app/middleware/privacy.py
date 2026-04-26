"""
PathSync AI — PHASE 1: Privacy & Redaction Middleware
Strips all PII, leaving only Academic DNA before data touches the LLM.
"""
import re
import spacy
from functools import lru_cache
from typing import Optional

# ── Load spaCy NER model (once) ──────────────────────────────────────────────
@lru_cache(maxsize=1)
def _load_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        # Fallback: regex-only mode if model not installed
        return None


# ── Regex patterns for Nigerian-context PII ──────────────────────────────────
PII_PATTERNS = [
    # Full name salutations
    (r'\b(Mr\.?|Mrs\.?|Miss|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*', '[REDACTED_NAME]'),
    # NIN (11-digit national ID)
    (r'\b\d{11}\b', '[REDACTED_NIN]'),
    # BVN (11-digit)
    (r'\b(BVN[:\s]*)?\d{11}\b', '[REDACTED_BVN]'),
    # Phone numbers (Nigerian formats)
    (r'\b(\+?234|0)[789]\d{9}\b', '[REDACTED_PHONE]'),
    # Email addresses
    (r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]'),
    # Physical addresses (Nigerian patterns)
    (r'\b\d+[,\s]+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Close|Crescent|Drive|Dr|Lane|Ln)\b', '[REDACTED_ADDRESS]'),
    # Dates of birth (common formats)
    (r'\b(DOB|Date of Birth|Born)[:\s]+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b', '[REDACTED_DOB]'),
    # Passport / ID numbers
    (r'\b[A-Z]{1,2}\d{6,8}\b', '[REDACTED_ID]'),
    # State of origin (privacy concern in Nigerian context)
    (r'\b(State of Origin|LGA|Local Government)[:\s]+[A-Za-z\s]+\b', '[REDACTED_STATE_OF_ORIGIN]'),
    # Bank account numbers
    (r'\b\d{10}\b(?=\s*(NUBAN|account|acct))', '[REDACTED_ACCOUNT]'),
]

# ── NER entity types to redact ────────────────────────────────────────────────
REDACT_ENTITY_TYPES = {"PERSON", "GPE", "LOC", "FAC", "ORG"}
# Note: ORG is included carefully — scholarships/universities are kept via allowlist
UNIVERSITY_ALLOWLIST = {
    "unilag", "university of lagos", "ui", "oau", "uniben", "abu",
    "futa", "lautech", "unn", "unizik", "covenant", "babcock",
    "mtn", "shell", "nlng", "tetfund", "chevron", "dangote"
}


def _ner_redact(text: str, nlp) -> str:
    """Use spaCy NER to redact named entities not in the allowlist."""
    doc = nlp(text)
    redacted = text
    # Process in reverse to preserve offsets
    for ent in reversed(doc.ents):
        if ent.label_ in REDACT_ENTITY_TYPES:
            lower_text = ent.text.lower()
            if not any(allowed in lower_text for allowed in UNIVERSITY_ALLOWLIST):
                redacted = redacted[:ent.start_char] + f"[REDACTED_{ent.label_}]" + redacted[ent.end_char:]
    return redacted


def _regex_redact(text: str) -> str:
    """Apply all regex PII patterns."""
    for pattern, replacement in PII_PATTERNS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def redact_pii(text: str, use_ner: bool = True) -> dict:
    """
    Main redaction function.
    
    Args:
        text: Raw student input or document text
        use_ner: Whether to use spaCy NER (True) or regex-only (False)
    
    Returns:
        {
            "redacted_text": str,       # Safe text for LLM
            "pii_found": bool,          # Whether PII was detected
            "redaction_count": int      # Number of replacements made
        }
    """
    original = text
    redacted = _regex_redact(text)

    if use_ner:
        nlp = _load_nlp()
        if nlp:
            redacted = _ner_redact(redacted, nlp)

    pii_found = redacted != original
    redaction_count = redacted.count("[REDACTED_")

    return {
        "redacted_text": redacted,
        "pii_found": pii_found,
        "redaction_count": redaction_count,
    }


def extract_academic_dna(text: str) -> dict:
    """
    After redaction, extract only academic-relevant data.
    Returns structured 'Academic DNA' dict for downstream use.
    """
    # CGPA / GPA
    cgpa_match = re.search(
        r'\b(CGPA|GPA|cumulative)[:\s]*([0-4]\.\d{1,2})\s*(\/\s*[45]\.0)?', 
        text, re.IGNORECASE
    )
    cgpa = float(cgpa_match.group(2)) if cgpa_match else None

    # Major / Department
    major_match = re.search(
        r'\b(department|faculty|major|programme|course of study)[:\s]+([A-Za-z\s&]+)',
        text, re.IGNORECASE
    )
    major = major_match.group(2).strip() if major_match else None

    # Level
    level_match = re.search(r'\b([1-5]00\s*[Ll]evel|[Ll]\d{3}|year\s+[1-5])\b', text)
    level = level_match.group(0) if level_match else None

    return {
        "cgpa": cgpa,
        "major": major,
        "level": level,
        "redacted_text": redact_pii(text)["redacted_text"],
    }
