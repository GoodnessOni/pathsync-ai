"""
Offline NaijaOpportunities listings feed reader for PathSync.

Pure functions: no network, no database, no HTTP routes.
Field names follow docs/data-contract.md (ogverse.listings 1.0.0).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

# Top-level keys required on every listing (contract §9.1).
REQUIRED_LISTING_FIELDS: tuple[str, ...] = (
    "schema_version",
    "listing_id",
    "kind",
    "synthetic",
    "revision",
    "title",
    "summary",
    "description",
    "provider",
    "source",
    "application",
    "eligibility",
    "deadline",
    "award",
    "location",
    "employment",
    "documents_required",
    "how_to_apply",
    "lifecycle",
    "verification",
    "timestamps",
    "identity",
    "dedupe_key",
    "content_hash",
    "previous_round_id",
)

WAT = "Africa/Lagos"
CHECK_ELIGIBILITY = "Check eligibility"
CHECK_EDUCATION = "Check education eligibility"


@dataclass
class FeedError:
    code: str
    field: str
    message: str
    listing_id: str | None = None


@dataclass
class Feed:
    listings: list[dict[str, Any]] = field(default_factory=list)
    errors: list[FeedError] = field(default_factory=list)
    schema_version: str | None = None
    feed: str | None = None


@dataclass
class VisibleListing:
    listing: dict[str, Any]
    warnings: list[str]
    resolved_deadline: datetime | None


@dataclass
class WithheldListing:
    listing_id: str
    reason: str


@dataclass
class StudentListings:
    visible: list[VisibleListing] = field(default_factory=list)
    withheld: list[WithheldListing] = field(default_factory=list)


def _schema_major(version: Any) -> int | None:
    if not isinstance(version, str):
        return None
    parts = version.split(".")
    if not parts:
        return None
    try:
        return int(parts[0])
    except ValueError:
        return None


def _error(
    code: str,
    field_name: str,
    listing_id: str | None = None,
) -> FeedError:
    return FeedError(
        code=code,
        field=field_name,
        message=f"{code}: {field_name}",
        listing_id=listing_id,
    )


def _parse_utc(value: str) -> datetime:
    """Parse a contract UTC timestamp into an aware datetime."""
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _ensure_aware(now: datetime) -> datetime:
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    return now


def resolve_deadline(deadline: dict[str, Any]) -> datetime | None:
    """
    Resolve a listing deadline to a timezone-aware datetime.

    Uses stated_timezone when present; Africa/Lagos (WAT) only when none is given.
    Rolling and unknown kinds have no invented date.
    """
    if not isinstance(deadline, dict):
        return None
    kind = deadline.get("kind")
    if kind != "fixed":
        return None

    stated = deadline.get("stated_timezone")
    tz_name = stated if stated else WAT
    # Prefer contract resolved_timezone when it already matches the rule.
    resolved = deadline.get("resolved_timezone")
    if stated and resolved:
        tz_name = resolved
    elif not stated:
        tz_name = WAT

    display_date = deadline.get("display_date")
    if not display_date:
        # Fall back to fixed_at when local parts are absent.
        fixed_at = deadline.get("fixed_at")
        if not fixed_at:
            return None
        return _parse_utc(fixed_at).astimezone(ZoneInfo(tz_name))

    year, month, day = (int(p) for p in display_date.split("-"))
    local_time = deadline.get("local_time")
    form = deadline.get("form")
    if form == "date_only" or not local_time:
        hour, minute, second = 23, 59, 59
    else:
        hour, minute, second = (int(p) for p in local_time.split(":"))

    return datetime(
        year, month, day, hour, minute, second, tzinfo=ZoneInfo(tz_name)
    )


def _validate_listing(record: Any) -> tuple[dict[str, Any] | None, list[FeedError]]:
    errors: list[FeedError] = []
    if not isinstance(record, dict):
        errors.append(_error("invalid_type", "$"))
        return None, errors

    listing_id = record.get("listing_id") if isinstance(record.get("listing_id"), str) else None

    for name in REQUIRED_LISTING_FIELDS:
        if name not in record:
            errors.append(_error("missing_required_field", name, listing_id))

    version = record.get("schema_version")
    major = _schema_major(version)
    if version is not None and major is not None and major != 1:
        errors.append(_error("unsupported_schema_version", "schema_version", listing_id))

    if errors:
        return None, errors
    return record, errors


def load_feed(data: Any) -> Feed:
    """
    Parse feed JSON (string, page object, or listings array).

    Records missing contract-required fields are skipped and reported;
    other records are kept. A page-level unsupported major fails the feed.
    """
    if isinstance(data, (bytes, bytearray)):
        data = data.decode("utf-8")
    if isinstance(data, str):
        data = json.loads(data)

    feed = Feed()

    if isinstance(data, dict) and "listings" in data:
        feed.schema_version = data.get("schema_version")
        feed.feed = data.get("feed")
        page_major = _schema_major(feed.schema_version)
        if feed.schema_version is not None and page_major is not None and page_major != 1:
            raise ValueError("unsupported_schema_version: schema_version")
        raw_listings = data.get("listings")
        if not isinstance(raw_listings, list):
            raise ValueError("invalid_type: listings")
    elif isinstance(data, list):
        raw_listings = data
    elif isinstance(data, dict):
        # Single listing object.
        raw_listings = [data]
    else:
        raise ValueError("invalid_type: $")

    for record in raw_listings:
        listing, errors = _validate_listing(record)
        feed.errors.extend(errors)
        if listing is not None:
            feed.listings.append(listing)

    return feed


def _citizenship_decision(
    citizenship: dict[str, Any],
    nationality: str | None,
) -> tuple[str, str | None]:
    """
    Returns (action, detail) where action is include | exclude | warn.
    """
    requirement = citizenship.get("requirement")
    countries = citizenship.get("countries") or []

    if requirement == "unconstrained":
        return "include", None
    if requirement == "unknown":
        return "warn", CHECK_ELIGIBILITY
    if requirement == "explicit":
        if not nationality:
            return "warn", CHECK_ELIGIBILITY
        if nationality not in countries:
            return "exclude", "citizenship_mismatch"
        return "include", None
    # Unrecognised requirement: treat as unknown eligibility.
    return "warn", CHECK_ELIGIBILITY


def _education_decision(
    education: dict[str, Any],
    student: dict[str, Any],
) -> tuple[str, str | None]:
    requirement = education.get("requirement")
    if requirement == "unrestricted":
        return "include", None
    if requirement == "unknown":
        return "warn", CHECK_EDUCATION

    if requirement != "restricted":
        return "warn", CHECK_EDUCATION

    stages = education.get("stages") or []
    if stages == ["secondary"]:
        return "exclude", "education_stage"

    student_edu = student.get("education") or {}
    checks: list[tuple[str, list[str], str | None, str]] = [
        ("stages", stages, student_edu.get("stage"), "education_stage"),
        (
            "qualifications",
            education.get("qualifications") or [],
            student_edu.get("qualification"),
            "education_qualification",
        ),
        (
            "courses",
            education.get("courses") or [],
            student_edu.get("course"),
            "education_course",
        ),
        (
            "years",
            education.get("years") or [],
            student_edu.get("year"),
            "education_year",
        ),
    ]
    institutions = education.get("institutions") or {}
    inst_names = institutions.get("names") or []
    if institutions.get("requirement") == "restricted" and inst_names:
        checks.append(
            (
                "institutions",
                inst_names,
                student_edu.get("institution"),
                "education_institution",
            )
        )

    active = [(allowed, answer, reason) for _, allowed, answer, reason in checks if allowed]
    if not active:
        return "include", None

    unanswered = any(answer is None for _, answer, _ in active)
    if unanswered:
        return "warn", CHECK_EDUCATION

    for allowed, answer, reason in active:
        if answer not in allowed:
            return "exclude", reason
    return "include", None


def _demographic_decision(
    demographics: dict[str, Any],
    student: dict[str, Any],
) -> tuple[str, str | None]:
    requirements = demographics.get("requirements") or []
    if not requirements:
        return "include", None

    if "demographics" not in student or student.get("demographics") is None:
        return "warn", CHECK_ELIGIBILITY

    answers = student.get("demographics") or []
    answer_set = set(answers)
    for token in requirements:
        if token not in answer_set:
            return "exclude", "demographic_requirement"
    return "include", None


def listings_for_student(
    feed: Feed | list[dict[str, Any]],
    student: dict[str, Any],
    now: datetime,
) -> StudentListings:
    """
    Apply citizenship, education, demographic, freshness, and deadline rules.

    Visible listings carry warnings and a resolved timezone-aware deadline.
    Withheld listing ids are returned with reasons.
    """
    now = _ensure_aware(now)
    listings = feed.listings if isinstance(feed, Feed) else list(feed)
    result = StudentListings()

    for listing in listings:
        listing_id = listing.get("listing_id", "")
        warnings: list[str] = []

        verification = listing.get("verification") or {}
        fresh_until = verification.get("fresh_until")
        if not fresh_until:
            result.withheld.append(WithheldListing(listing_id, "not_verified"))
            continue
        fresh_until_dt = _parse_utc(fresh_until)
        if now > fresh_until_dt:
            result.withheld.append(WithheldListing(listing_id, "stale_listing"))
            continue

        deadline = listing.get("deadline") or {}
        resolved = resolve_deadline(deadline)
        fixed_at = deadline.get("fixed_at")
        if deadline.get("kind") == "fixed":
            expiry = _parse_utc(fixed_at) if fixed_at else (
                resolved.astimezone(timezone.utc) if resolved else None
            )
            if expiry is not None and now > expiry:
                result.withheld.append(WithheldListing(listing_id, "expired_deadline"))
                continue

        eligibility = listing.get("eligibility") or {}
        citizenship = eligibility.get("citizenship") or {}
        action, detail = _citizenship_decision(citizenship, student.get("nationality"))
        if action == "exclude":
            result.withheld.append(WithheldListing(listing_id, detail or "citizenship_mismatch"))
            continue
        if action == "warn" and detail:
            warnings.append(detail)

        education = eligibility.get("education") or {}
        action, detail = _education_decision(education, student)
        if action == "exclude":
            result.withheld.append(WithheldListing(listing_id, detail or "education_mismatch"))
            continue
        if action == "warn" and detail:
            warnings.append(detail)

        demographics = eligibility.get("demographics") or {}
        action, detail = _demographic_decision(demographics, student)
        if action == "exclude":
            result.withheld.append(
                WithheldListing(listing_id, detail or "demographic_requirement")
            )
            continue
        if action == "warn" and detail:
            warnings.append(detail)

        # De-duplicate warnings while preserving order.
        seen: set[str] = set()
        ordered_warnings: list[str] = []
        for w in warnings:
            if w not in seen:
                seen.add(w)
                ordered_warnings.append(w)

        result.visible.append(
            VisibleListing(
                listing=listing,
                warnings=ordered_warnings,
                resolved_deadline=resolved,
            )
        )

    return result
