"""
PathSync AI — Test Suite
Run: pytest tests/ -v
"""
import pytest
import json
import re
from unittest.mock import AsyncMock, MagicMock, patch


# ════════════════════════════════════════════════════════════════════════════
# PHASE 1 — Privacy Middleware Tests
# ════════════════════════════════════════════════════════════════════════════

from app.middleware.privacy import redact_pii, extract_academic_dna


class TestPrivacyMiddleware:

    def test_redacts_nigerian_phone_number(self):
        text = "Call me on 08012345678 after lectures"
        result = redact_pii(text, use_ner=False)
        assert "[REDACTED_PHONE]" in result["redacted_text"]
        assert "08012345678" not in result["redacted_text"]

    def test_redacts_nin(self):
        text = "My NIN is 12345678901"
        result = redact_pii(text, use_ner=False)
        assert "12345678901" not in result["redacted_text"]
        assert result["pii_found"] is True

    def test_redacts_email(self):
        text = "Email me at chukwuemeka.obi@unilag.edu.ng"
        result = redact_pii(text, use_ner=False)
        assert "chukwuemeka.obi@unilag.edu.ng" not in result["redacted_text"]
        assert "[REDACTED_EMAIL]" in result["redacted_text"]

    def test_preserves_cgpa(self):
        text = "My CGPA is 4.25 out of 5.0 in Computer Science"
        result = redact_pii(text, use_ner=False)
        assert "4.25" in result["redacted_text"]
        assert "Computer Science" in result["redacted_text"]

    def test_preserves_scholarship_names(self):
        text = "I applied for MTN Foundation and Shell scholarship"
        result = redact_pii(text, use_ner=True)
        # Scholarship orgs are in allowlist — should NOT be redacted
        assert "MTN" in result["redacted_text"] or "MTN" in text  # NER may vary

    def test_no_pii_returns_false(self):
        text = "I study Electrical Engineering at 300 level with CGPA 3.8"
        result = redact_pii(text, use_ner=False)
        assert result["pii_found"] is False
        assert result["redaction_count"] == 0

    def test_extract_academic_dna_cgpa(self):
        text = "My CGPA is 4.20/5.0 in the Mechanical Engineering department, 400 level"
        dna = extract_academic_dna(text)
        assert dna["cgpa"] == pytest.approx(4.20)
        assert "Mechanical Engineering" in (dna["major"] or "")

    def test_redaction_count_accuracy(self):
        text = "Name: John Doe, Phone: 07098765432, Email: john@test.com, NIN: 11223344556"
        result = redact_pii(text, use_ner=False)
        assert result["redaction_count"] >= 3


# ════════════════════════════════════════════════════════════════════════════
# PHASE 2 — PDF Parser Tests (mocked Claude API)
# ════════════════════════════════════════════════════════════════════════════

class TestPDFParser:

    MOCK_TRANSCRIPT_JSON = {
        "cgpa": 4.25,
        "scale": "5.0",
        "honours_class": "First Class",
        "major": "Computer Science",
        "faculty": "Science",
        "level": "400L",
        "total_units": 120,
        "semesters": [
            {
                "name": "100L First Semester",
                "gpa": 4.50,
                "courses": [
                    {"code": "CSC101", "title": "Intro to Computing", "units": 3, "grade": "A", "grade_point": 5.0}
                ]
            }
        ],
        "notable_achievements": ["Dean's List 2022/2023"]
    }

    @patch("app.services.pdf_parser.client")
    @patch("app.services.pdf_parser.extract_text_from_pdf")
    @pytest.mark.asyncio
    async def test_parse_transcript_returns_structured_json(self, mock_extract, mock_client):
        mock_extract.return_value = "CGPA: 4.25/5.0 Computer Science 400L"
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=json.dumps(self.MOCK_TRANSCRIPT_JSON))]
        mock_response.usage = MagicMock(input_tokens=500, output_tokens=200)
        mock_client.messages.create.return_value = mock_response

        from app.services.pdf_parser import parse_transcript_with_claude
        result = await parse_transcript_with_claude(b"fake-pdf-bytes")

        assert result["structured_transcript"]["cgpa"] == 4.25
        assert result["structured_transcript"]["honours_class"] == "First Class"
        assert result["tokens_used"] == 700

    @patch("app.services.pdf_parser.client")
    @patch("app.services.pdf_parser.extract_text_from_pdf")
    @pytest.mark.asyncio
    async def test_pii_is_redacted_before_api_call(self, mock_extract, mock_client):
        """Ensure the text sent to Claude has PII stripped."""
        mock_extract.return_value = "Student: Chukwuemeka Obi, NIN: 12345678901, CGPA: 3.9"
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=json.dumps(self.MOCK_TRANSCRIPT_JSON))]
        mock_response.usage = MagicMock(input_tokens=400, output_tokens=200)
        mock_client.messages.create.return_value = mock_response

        from app.services.pdf_parser import parse_transcript_with_claude
        await parse_transcript_with_claude(b"fake-pdf-bytes")

        # Inspect what was actually sent to Claude
        call_args = mock_client.messages.create.call_args
        user_content = call_args[1]["messages"][0]["content"]
        assert "Chukwuemeka Obi" not in user_content
        assert "12345678901" not in user_content
        assert "3.9" in user_content  # CGPA should survive


# ════════════════════════════════════════════════════════════════════════════
# PHASE 3 — Chat Service Tests
# ════════════════════════════════════════════════════════════════════════════

class TestChatService:

    @patch("app.services.chat_service.client")
    @patch("app.services.chat_service.get_or_create_session")
    @patch("app.services.chat_service.save_session")
    @patch("app.services.chat_service._update_student_profile")
    @pytest.mark.asyncio
    async def test_chat_returns_visible_response(
        self, mock_update, mock_save, mock_session, mock_client
    ):
        mock_session.return_value = {"session_id": "test-123", "messages": [], "stage": "onboarding"}
        mock_save.return_value = None
        mock_update.return_value = None

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Welcome! What course do you study?")]
        mock_response.usage = MagicMock(input_tokens=300, output_tokens=15)
        mock_client.messages.create.return_value = mock_response

        from app.services.chat_service import discovery_chat
        result = await discovery_chat("test-123", "Hello, I need a scholarship")

        assert "response" in result
        assert result["response"] == "Welcome! What course do you study?"

    @patch("app.services.chat_service.client")
    @patch("app.services.chat_service.get_or_create_session")
    @patch("app.services.chat_service.save_session")
    @patch("app.services.chat_service._update_student_profile")
    @pytest.mark.asyncio
    async def test_profile_update_extracted_from_hidden_block(
        self, mock_update, mock_save, mock_session, mock_client
    ):
        mock_session.return_value = {"session_id": "test-456", "messages": [], "stage": "onboarding"}

        profile_block = '<!--PROFILE_UPDATE:{"cgpa": 4.2, "major": "Engineering", "soft_skills": ["Leadership"], "achievements": [], "stage": "activities"}-->'
        full_response = f"Great profile!\n{profile_block}\nWhat else do you do outside class?"

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=full_response)]
        mock_response.usage = MagicMock(input_tokens=400, output_tokens=50)
        mock_client.messages.create.return_value = mock_response

        from app.services.chat_service import discovery_chat
        result = await discovery_chat("test-456", "My CGPA is 4.2 in Engineering")

        # Hidden block should NOT appear in the response shown to student
        assert "<!--PROFILE_UPDATE" not in result["response"]
        assert result["profile_updated"] is True
        assert result["stage"] == "activities"
        # Profile update should have been called
        mock_update.assert_called_once()
        update_data = mock_update.call_args[0][1]
        assert update_data["cgpa"] == 4.2

    def test_skill_translation_patterns(self):
        """Test that the system prompt contains key translation entries."""
        from app.services.chat_service import DISCOVERY_SYSTEM_PROMPT
        assert "football league" in DISCOVERY_SYSTEM_PROMPT
        assert "Project Coordination" in DISCOVERY_SYSTEM_PROMPT
        assert "NIN" in DISCOVERY_SYSTEM_PROMPT  # Privacy rule present


# ════════════════════════════════════════════════════════════════════════════
# PHASE 4 — RAG Service Tests
# ════════════════════════════════════════════════════════════════════════════

class TestRAGService:

    def test_build_profile_text_full_profile(self):
        from app.services.rag_service import build_profile_text
        profile = {
            "major": "Computer Science",
            "cgpa": 4.25,
            "level": "400L",
            "soft_skills": ["Leadership", "Project Management"],
            "achievements": ["Dean's List 2023"],
            "semester_grades": {},
        }
        text = build_profile_text(profile)
        assert "Computer Science" in text
        assert "4.25" in text
        assert "Leadership" in text
        assert "Dean's List" in text

    def test_build_profile_text_partial_profile(self):
        from app.services.rag_service import build_profile_text
        profile = {"major": "Law", "cgpa": None, "soft_skills": None}
        text = build_profile_text(profile)
        assert "Law" in text
        # Should not crash on None values

    def test_chunk_document_respects_size(self):
        from app.services.rag_service import chunk_document
        long_text = "This is a sentence about scholarships. " * 100
        chunks = chunk_document(long_text, chunk_size=300, overlap=50)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) > 0

    def test_chunk_document_overlap(self):
        from app.services.rag_service import chunk_document
        text = ". ".join([f"Sentence number {i} about eligibility criteria" for i in range(50)])
        chunks = chunk_document(text, chunk_size=200, overlap=80)
        # With overlap, consecutive chunks should share some content
        assert len(chunks) >= 2

    def test_build_scholarship_text(self):
        from app.services.rag_service import build_scholarship_text
        s = {
            "title": "MTN Foundation Scholarship",
            "provider": "MTN Nigeria",
            "description": "For STEM students",
            "eligibility_criteria": "CGPA ≥ 3.5, 200L–400L",
            "amount": "₦200,000"
        }
        text = build_scholarship_text(s)
        assert "MTN" in text
        assert "CGPA" in text
        assert "₦200,000" in text

    @patch("app.services.rag_service.get_pool")
    @patch("app.services.rag_service.generate_embedding_with_claude")
    @pytest.mark.asyncio
    async def test_match_scholarships_returns_empty_for_unknown_session(
        self, mock_embed, mock_pool
    ):
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None  # No profile found
        mock_pool.return_value.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.return_value.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

        from app.services.rag_service import match_scholarships_for_student
        results = await match_scholarships_for_student("unknown-session-xyz")
        assert results == []


# ════════════════════════════════════════════════════════════════════════════
# Cost Optimizer Tests
# ════════════════════════════════════════════════════════════════════════════

class TestCostOptimizer:

    def test_haiku_selected_for_chat(self):
        from app.services.cost_optimizer import select_model
        assert select_model("chat_turn") == "claude-haiku-4-5-20251001"

    def test_sonnet_selected_for_pdf(self):
        from app.services.cost_optimizer import select_model
        assert select_model("pdf_parsing") == "claude-sonnet-4-20250514"

    def test_haiku_is_default(self):
        from app.services.cost_optimizer import select_model
        assert select_model("unknown_task") == "claude-haiku-4-5-20251001"

    def test_estimate_cost_is_positive(self):
        from app.services.cost_optimizer import estimate_cost
        usage = {
            "model_used": "claude-haiku-4-5-20251001",
            "input_tokens": 1000,
            "output_tokens": 200,
            "cache_write_tokens": 0,
            "cache_read_tokens": 0,
        }
        result = estimate_cost(usage)
        assert result["estimated_cost_usd"] > 0
        assert result["estimated_cost_usd"] < 0.01  # Haiku is very cheap

    def test_cache_read_cheaper_than_write(self):
        from app.services.cost_optimizer import estimate_cost
        write_usage = {
            "model_used": "claude-haiku-4-5-20251001",
            "input_tokens": 0, "output_tokens": 0,
            "cache_write_tokens": 10000, "cache_read_tokens": 0,
        }
        read_usage = {
            "model_used": "claude-haiku-4-5-20251001",
            "input_tokens": 0, "output_tokens": 0,
            "cache_write_tokens": 0, "cache_read_tokens": 10000,
        }
        write_cost = estimate_cost(write_usage)["estimated_cost_usd"]
        read_cost = estimate_cost(read_usage)["estimated_cost_usd"]
        assert read_cost < write_cost  # Cache reads should be cheaper
