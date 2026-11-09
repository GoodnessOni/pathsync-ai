"""
Offline listings feed reader tests (stdlib unittest).

Run from backend/:
  python3 -m unittest tests.test_listings_feed -v
"""

from __future__ import annotations

import copy
import unittest
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.services.listings_feed import (
    CHECK_EDUCATION,
    CHECK_ELIGIBILITY,
    WAT,
    load_feed,
    listings_for_student,
    resolve_deadline,
)


def _base_listing(**overrides):
    listing = {
        "schema_version": "1.0.0",
        "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "kind": "scholarship",
        "synthetic": False,
        "revision": 1,
        "title": "Test Award",
        "summary": "A test award for feed reader unit tests.",
        "description": "Synthetic-enough description used only in offline unit tests.",
        "provider": {
            "name": "River Trust",
            "type": "foundation",
            "country": "NG",
            "url": None,
        },
        "source": {
            "name": "synthetic-directory",
            "kind": "aggregator",
            "url": "https://directory.example/listings/test",
            "retrieved_at": "2026-11-08T09:00:00Z",
        },
        "application": {
            "url": "https://apply.rivertrust.example/2027",
            "url_kind": "official_programme_page",
            "contact_email": None,
        },
        "eligibility": {
            "citizenship": {"requirement": "unconstrained", "countries": ["*"]},
            "education": {
                "requirement": "unrestricted",
                "stages": [],
                "qualifications": [],
                "courses": [],
                "years": [],
                "institutions": {"requirement": "unrestricted", "names": []},
                "source_wording": "Not stated by the source.",
            },
            "grade": {
                "requirement": "none",
                "scale": None,
                "minimum_hundredths": None,
                "source_wording": "Not stated by the source.",
            },
            "demographics": {"requirements": [], "preferences": []},
            "audience_tags": [],
            "criteria_stated": False,
            "criteria_text": "Not stated by the source.",
        },
        "deadline": {
            "kind": "fixed",
            "form": "date_only",
            "stated_timezone": None,
            "resolved_timezone": "Africa/Lagos",
            "display_date": "2027-03-31",
            "local_time": "23:59:59",
            "boundary": "inclusive_end_of_local_day",
            "fixed_at": "2027-03-31T22:59:59Z",
            "raw_text": "Closes 31 March 2027.",
        },
        "award": {
            "kind": "not_stated",
            "summary": None,
            "currency": None,
            "amount_minor": None,
            "period": None,
        },
        "location": {
            "country": "NG",
            "locality": None,
            "arrangement": "unknown",
        },
        "employment": None,
        "documents_required": [],
        "how_to_apply": "Not stated by the source.",
        "lifecycle": {
            "publication_status": "published",
            "status": "open",
            "closed_reason": None,
        },
        "verification": {
            "state": "verified",
            "outcome": "confirmed_open",
            "method": "automated_review",
            "reviewed_by": "automation",
            "reviewer_id": None,
            "source_checked_url": "https://apply.rivertrust.example/2027",
            "evidence": "Official provider page checked for open status.",
            "last_attempt_at": "2026-11-08T09:00:00Z",
            "last_attempt_outcome": "confirmed_open",
            "last_success_at": "2026-11-08T09:00:00Z",
            "fresh_until": "2026-11-15T09:00:00Z",
        },
        "timestamps": {
            "created_at": "2026-10-01T08:00:00Z",
            "updated_at": "2026-11-08T09:00:00Z",
            "published_at": "2026-10-01T08:00:00Z",
            "expired_at": None,
            "closed_at": None,
            "withdrawn_at": None,
        },
        "identity": {
            "provider_key": "river-trust",
            "opportunity_key": "test-award",
            "round_key": "2027",
            "round_evidence": "The source names the 2027 award.",
        },
        "dedupe_key": "a" * 64,
        "content_hash": "b" * 64,
        "previous_round_id": None,
    }
    listing.update(overrides)
    return listing


NOW = datetime(2026, 11, 8, 12, 0, 0, tzinfo=timezone.utc)


class TestLoadFeed(unittest.TestCase):
    def test_bad_record_reported_without_breaking_others(self):
        good = _base_listing()
        bad = copy.deepcopy(good)
        bad["listing_id"] = "lst_01ARZ3NDEKTSV4RRFFQ69G5FB0"
        del bad["title"]

        feed = load_feed({"schema_version": "1.0.0", "feed": "active", "listings": [bad, good]})

        self.assertEqual(len(feed.listings), 1)
        self.assertEqual(feed.listings[0]["listing_id"], good["listing_id"])
        self.assertEqual(len(feed.errors), 1)
        self.assertEqual(feed.errors[0].code, "missing_required_field")
        self.assertEqual(feed.errors[0].field, "title")
        self.assertIn("title", feed.errors[0].message)


class TestCitizenship(unittest.TestCase):
    def test_citizenship_mismatch_withheld(self):
        listing = _base_listing()
        listing["eligibility"]["citizenship"] = {
            "requirement": "explicit",
            "countries": ["NG"],
        }
        feed = load_feed([listing])
        student = {"nationality": "GH"}
        result = listings_for_student(feed, student, NOW)
        self.assertEqual(result.visible, [])
        self.assertEqual(result.withheld[0].listing_id, listing["listing_id"])
        self.assertEqual(result.withheld[0].reason, "citizenship_mismatch")

    def test_citizenship_match_visible(self):
        listing = _base_listing()
        listing["eligibility"]["citizenship"] = {
            "requirement": "explicit",
            "countries": ["NG"],
        }
        feed = load_feed([listing])
        result = listings_for_student(feed, {"nationality": "NG"}, NOW)
        self.assertEqual(len(result.visible), 1)
        self.assertEqual(result.withheld, [])

    def test_no_citizenship_requirement_visible(self):
        listing = _base_listing()
        listing["eligibility"]["citizenship"] = {
            "requirement": "unconstrained",
            "countries": ["*"],
        }
        feed = load_feed([listing])
        result = listings_for_student(feed, {"nationality": "GH"}, NOW)
        self.assertEqual(len(result.visible), 1)
        self.assertEqual(result.visible[0].warnings, [])


class TestEligibilityWarningsAndMismatches(unittest.TestCase):
    def test_unknown_eligibility_visible_with_warning(self):
        listing = _base_listing()
        listing["eligibility"]["citizenship"] = {
            "requirement": "unknown",
            "countries": [],
        }
        listing["eligibility"]["education"] = {
            "requirement": "unknown",
            "stages": [],
            "qualifications": [],
            "courses": [],
            "years": [],
            "institutions": {"requirement": "unknown", "names": []},
            "source_wording": "Not stated by the source.",
        }
        feed = load_feed([listing])
        result = listings_for_student(feed, {"nationality": "NG"}, NOW)
        self.assertEqual(len(result.visible), 1)
        self.assertIn(CHECK_ELIGIBILITY, result.visible[0].warnings)
        self.assertIn(CHECK_EDUCATION, result.visible[0].warnings)

    def test_confirmed_education_mismatch_excluded(self):
        listing = _base_listing()
        listing["eligibility"]["education"] = {
            "requirement": "restricted",
            "stages": ["undergraduate"],
            "qualifications": ["bachelor"],
            "courses": ["engineering"],
            "years": ["200", "300", "400"],
            "institutions": {"requirement": "unrestricted", "names": []},
            "source_wording": "Engineering undergraduates only.",
        }
        feed = load_feed([listing])
        student = {
            "nationality": "NG",
            "education": {
                "stage": "undergraduate",
                "qualification": "bachelor",
                "course": "law",
                "year": "300",
            },
        }
        result = listings_for_student(feed, student, NOW)
        self.assertEqual(result.visible, [])
        self.assertEqual(result.withheld[0].reason, "education_course")

    def test_confirmed_demographic_mismatch_excluded(self):
        listing = _base_listing()
        listing["eligibility"]["demographics"] = {
            "requirements": ["female"],
            "preferences": [],
        }
        feed = load_feed([listing])
        student = {"nationality": "NG", "demographics": []}
        result = listings_for_student(feed, student, NOW)
        self.assertEqual(result.visible, [])
        self.assertEqual(result.withheld[0].reason, "demographic_requirement")

    def test_unknown_demographic_visible_with_warning(self):
        listing = _base_listing()
        listing["eligibility"]["demographics"] = {
            "requirements": ["female"],
            "preferences": [],
        }
        feed = load_feed([listing])
        # demographics omitted → unanswered / unknown, not a confirmed no
        result = listings_for_student(feed, {"nationality": "NG"}, NOW)
        self.assertEqual(len(result.visible), 1)
        self.assertIn(CHECK_ELIGIBILITY, result.visible[0].warnings)


class TestDeadlinesAndFreshness(unittest.TestCase):
    def test_stated_timezone_deadline(self):
        listing = _base_listing()
        listing["deadline"] = {
            "kind": "fixed",
            "form": "date_only",
            "stated_timezone": "Europe/London",
            "resolved_timezone": "Europe/London",
            "display_date": "2027-03-31",
            "local_time": "23:59:59",
            "boundary": "inclusive_end_of_local_day",
            "fixed_at": "2027-03-31T22:59:59Z",
            "raw_text": "Closes 31 March 2027 UK time.",
        }
        resolved = resolve_deadline(listing["deadline"])
        self.assertIsNotNone(resolved)
        self.assertEqual(str(resolved.tzinfo), "Europe/London")
        self.assertEqual(resolved, datetime(2027, 3, 31, 23, 59, 59, tzinfo=ZoneInfo("Europe/London")))

        feed = load_feed([listing])
        result = listings_for_student(feed, {"nationality": "NG"}, NOW)
        self.assertEqual(result.visible[0].resolved_deadline, resolved)

    def test_wat_fallback_when_no_zone(self):
        listing = _base_listing()
        self.assertIsNone(listing["deadline"]["stated_timezone"])
        resolved = resolve_deadline(listing["deadline"])
        self.assertEqual(str(resolved.tzinfo), WAT)
        self.assertEqual(resolved, datetime(2027, 3, 31, 23, 59, 59, tzinfo=ZoneInfo(WAT)))

    def test_stale_fresh_until_dropped_equality_stays(self):
        listing = _base_listing()
        listing["verification"]["fresh_until"] = "2026-11-15T09:00:00Z"
        feed = load_feed([listing])

        at_boundary = datetime(2026, 11, 15, 9, 0, 0, tzinfo=timezone.utc)
        result = listings_for_student(feed, {"nationality": "NG"}, at_boundary)
        self.assertEqual(len(result.visible), 1)

        stale = datetime(2026, 11, 15, 9, 0, 1, tzinfo=timezone.utc)
        result = listings_for_student(feed, {"nationality": "NG"}, stale)
        self.assertEqual(result.visible, [])
        self.assertEqual(result.withheld[0].reason, "stale_listing")

    def test_expired_deadline_dropped_equality_stays(self):
        listing = _base_listing()
        listing["deadline"] = {
            "kind": "fixed",
            "form": "date_only",
            "stated_timezone": None,
            "resolved_timezone": "Africa/Lagos",
            "display_date": "2026-11-08",
            "local_time": "23:59:59",
            "boundary": "inclusive_end_of_local_day",
            "fixed_at": "2026-11-08T22:59:59Z",
            "raw_text": "Closes 8 November 2026.",
        }
        # Keep freshness open past the deadline so only deadline expiry applies.
        listing["verification"]["fresh_until"] = "2026-12-01T00:00:00Z"
        feed = load_feed([listing])

        at_boundary = datetime(2026, 11, 8, 22, 59, 59, tzinfo=timezone.utc)
        result = listings_for_student(feed, {"nationality": "NG"}, at_boundary)
        self.assertEqual(len(result.visible), 1)

        expired = datetime(2026, 11, 8, 23, 0, 0, tzinfo=timezone.utc)
        result = listings_for_student(feed, {"nationality": "NG"}, expired)
        self.assertEqual(result.visible, [])
        self.assertEqual(result.withheld[0].reason, "expired_deadline")


if __name__ == "__main__":
    unittest.main()
