# Glossary

This page gives plain meanings for the listing-contract words a newcomer will meet. The audience is a person who arrives about six months after 9 November 2026 and is reading the decision log or the contract for the first time.

The meanings come from `docs/data-contract.md` at commit `b50440dc738d86ff3070386d8709b8faf2bc5982`. If a definition here and that file disagree about a listing rule, that file wins. This page does not add a product rule.

## How to use it

1. Find the word. Expected result: you get the contract's meaning in plain language.
2. Use the section number to check the source. Expected result: you can confirm the sentence.
3. If the word you need is missing, ask OGverse Lead. Expected result: the gap is filled by a doc change after approval, not by a guessed rule.

## Words

**Active feed.** The student-facing set of listings that pass `validate_active_feed` at a given evaluation time. Withdrawn, closed, expired, unverified, and stale listings are off this feed. Section 14.

**Accepted URL.** A stored URL that already meets the section 12.1 list. The fixture check is `accept_url`. Failure returns `non_canonical_url` and does not rewrite the string.

**Ambiguous evidence.** Evidence the contract sends to a human review because it is ambiguous, inaccessible, changed, or conflicting. Section 5, Agreed 1, and section 13. OGverse Lead reports that unprefixed custom strings such as `200 Fine` and `404 Nope` remain in that group. This page does not add a `Read:` marker or a new field for them.

**Africa/Lagos.** The IANA zone the contract uses only when a deadline source names no zone. In the sample timezone data, tzdata `2026e`, it is a fixed UTC+1 offset. Section 10. The contract does not say why this zone is the fallback. That motive is not documented. OGverse Lead owns clarification.

**Application URL.** `application.url`. The best next page for the student. It is not the listing's identity. The same round may change it on a later revision. Section 9.4.

**Assessment.** The caller's judgement passed into `decide_attempt`, as OGverse Lead describes Card 2. A trusted `clear`, or a human-resolved assessment, can allow a successful verification only when the attempt is also successful and record-valid. Lead reports that a caller can pass `clear` together with an unprefixed string such as `200 Fine` and still permit success. The caller's assessment is trust-critical. Caller trust is not implemented in that gate.

**Attempt gate.** OGverse Lead's name for Card 2, the producer verification attempt gate. Lead accepts it as a bounded primitive only. It decides whether an attempt may count as a successful verification. It does not decide active-feed eligibility, and it does not implement the human-review routing workflow from the 02:11 WAT report.

**Audience tags.** Descriptive labels such as `nigerian_university_student`. They are not a citizenship requirement and they do not hard-exclude a student. Section 9.5.

**Automation.** A review done by a bot. Stored as `reviewed_by` `automation` and `method` `automated_review`, with `reviewer_id` null. A bot review is not stored as `human`. Section 13.

**Bounded primitive.** OGverse Lead's limit on Card 2. The attempt gate is only the `decide_attempt` decision Lead describes. Caller trust, source inspection, reviewer authorisation, a review queue, storage, revocation, and publication integration are not part of it. Lead does not call it production-ready or release-ready.

**Canonical IANA name.** A time-zone name that matches its own IANA key, `ZoneInfo(name).key == name`. This is a timezone term. It is not the URL helper. Section 10.

**Check eligibility.** The label for a discoverable unknown on citizenship, demographics, or grade. It is not a claim that the student is eligible, and it is not a hide. Section 11.2.

**Check education eligibility.** The label for unknown education rules, or for a restricted education point the student has not answered. Section 11.2.

**Consumer.** PathSync, repository `GoodnessOni/pathsync-ai`. It reads listings and applies the student filter. Section 3.

**Content hash.** SHA-256 of the canonical JSON of the listing with `content_hash` removed and the other fields kept. A different body at the same revision is `revision_conflict`. Section 16.

**Contract.** The listings data contract, `docs/data-contract.md`, schema `ogverse.listings` version `1.0.0`.

**Dedupe key.** SHA-256 hex of `kind`, provider key, opportunity key, and round key. The application URL is not an input. The same key means the same round. Section 16.

**decide_attempt.** The name OGverse Lead uses for the Card 2 gate. It allows a successful verification only when the assessment is a trusted `clear` or a human-resolved one, and the attempt is successful and record-valid. An ambiguous attempt blocks. A failed attempt blocks, and a failed attempt cannot renew an old success. Active-feed eligibility is a separate decision. This page does not describe the code.

**Evaluation time.** The UTC instant passed into the active-feed check, the historical check, and the student filter. The checks do not read the wall clock. The samples use `2026-11-08T12:00:00Z`. Section 7.

**Exclude.** The student-filter result that drops a listing for one student, with a reason. A confirmed explicit mismatch is an exclusion. An unknown fact is not an exclusion. Section 11.2.

**Explicit citizenship.** The source gives a nationality list. `countries` holds ISO country codes. `*` is forbidden. The student is excluded only when their nationality is present and is not in that list. Section 9.5.

**Expired.** A fixed deadline whose `fixed_at` is before the evaluation time, after the producer has marked the lifecycle expired. Equality with `fixed_at` is still open. Rolling and unknown deadlines are never expired by the clock test. Section 10.

**Fresh until.** The UTC instant exactly 168 hours after the last successful check. The listing is still active at that exact instant. The next second is stale. Humans and automation use this same window. Section 13. The contract does not say why the length is seven days. That motive is not documented. OGverse Lead owns clarification.

**Historical record.** A retained row checked with `validate_historical`. Expired and withdrawn rows can be retained. History is not a way to keep an open listing whose fixed deadline has already passed. Section 14.

**Human review.** A person reviewed ambiguous, inaccessible, changed, or conflicting evidence. Stored with `reviewed_by` `human`, `method` `human_review`, and an opaque `reviewer_id`. The id is not a student's name. Section 13. The contract names that review. OGverse Lead reports that the routing which would send a case to a person is not implemented or proven. An active-feed pass does not do that routing. Card 2's `decide_attempt` does not do it either. OGverse Lead assigns any next card. This page does not describe the workflow.

**Hundredths.** The integer form of a grade on one stated scale. 3.50 is 350. A 4.0 scale uses 1..400. A 5.0 scale uses 1..500. Unlike scales are not converted. Section 9.5.

**Include.** The student-filter result that the listing may be shown. It is guidance. It does not promise an award or a job. Section 11.2.

**Internship.** One of the three listing kinds. It stays in student matching when the rest of section 11 passes. Section 5.

**Job.** One of the three listing kinds. A job with no degree requirement stays in student matching and is shown as a job. Section 5.

**Listing.** One JSON object for a scholarship, internship, or job. Version 1.0.0 has no optional keys. A nullable value is present as JSON `null`. Section 8.

**Listing id.** `listing_id`. The stable id of one round. It matches `^lst_[0-9A-HJKMNP-TV-Z]{26}$`. It is never reused. It is not a URL, a title slug, or PathSync's local UUID. Section 9.1 and section 15.

**Lock.** The pin record in section 20. Inside this contract file the sample lock has `git_sha` null, because the file does not name its own SHA. OGverse Lead reports that a validator card was later released with a lock of exact SHA `b50440dc738d86ff3070386d8709b8faf2bc5982`. Lead later names a reviewed validator commit, `36bfd66f3875ca0796b000b0339cdc06ad9a71da`, in the other repository. That commit is not a new contract pin. This glossary does not assert that the other repository was inspected.

**Nationality.** The country the student states, one ISO 3166-1 alpha-2 code. It lives on the student profile. It is not the listing's citizenship object. Section 5.

**Needs check.** The student-filter result that keeps a listing discoverable because a needed fact is unknown. It must not be labelled eligible. Section 11.2.

**Non-canonical URL.** The error code `non_canonical_url`. It means a stored URL failed acceptance. It does not mean the normaliser rewrites the stored value. Section 12.1.

**Normalisation.** The helper `normalise_url`. It lowercases the host, drops a trailing slash, drops the tracking keys listed in section 12, sorts the query, and removes a fragment. It does not accept the input. Section 12.2 is titled "Normalisation is not acceptance."

**Owner.** Goodness. The contract says the owner approves, amends, or rejects it. Section 3.

**PathSync.** The consumer product and the `GoodnessOni/pathsync-ai` repository.

**Pin.** The 40-character commit SHA of the contract text a reader treats as the source. The branch name is not a pin. Section 6 and section 20. The blank "Approved corrected pin" cell is metadata inside commit `b50440d`. OGverse Lead reports a separate direct approval of that same SHA at 00:42 WAT on 9 November 2026. The report is not a line written into the cell.

**NaijaOpportunities.** The producer product and the `GoodnessOni/naija-opportunities` repository.

**Preference.** A demographic preference. It may affect ranking. It never hard-excludes. The ranking formula is not defined and is outside the validator card. Section 5 and section 22 item 14.

**Previous round id.** The earlier `listing_id`, set only when the producer confirms that a new round continues an earlier one. Section 15.

**Producer.** NaijaOpportunities. It creates and updates listings and runs the producer validator before publish. Section 3.

**Requirement.** A hard condition. A confirmed mismatch excludes that student. An unknown answer stays discoverable. Section 5.

**Resolved timezone.** The IANA name actually used to compute `fixed_at`. It is the stated zone, or `Africa/Lagos` when the source names none. Section 10.

**Revision.** An integer from 1 to 1000000. An update of the same id increases it by 1. Section 9.1 and section 15.

**Round.** One application round of one opportunity. `round_key` is the slug. `unspecified` is used only when the source names no round. Section 15.

**Same round.** The same kind, provider key, opportunity key, and round key. It keeps its `listing_id` when it is restored or when the application URL changes. Section 5 and section 15.

**Scholarship.** One of the three listing kinds. `employment` is null only for a scholarship. Section 9.1.

**Source URL.** `source.url`. The page the facts were taken from. It can differ from the application URL. Section 12.

**Stale.** The freshness window has passed while the listing is otherwise still open. Stale hides it from matching. Stale does not set `status` to `expired`. Section 5 and section 13.

**Stated timezone.** The canonical IANA name when the source names a zone. Null when the source names none. Section 10.

**Synthetic.** `synthetic: true` marks a fixture. Student surfaces drop those rows. Production rows that real students could see use `false`. Section 8.

**Syntax check.** OGverse Lead's name for the checks Goodness is reported to have approved at 02:11 WAT on 9 November 2026, together with human review for ambiguous evidence. This page does not define a new check. The pinned acceptance rules, and the rule that evidence must name what was read, stay in commit `b50440d`. The report is not approval of false evidence.

**Tombstone.** The minimal withdrawn record kept in the historical feed for 730 × 24 hours after `withdrawn_at`. It lets saved copies say Withdrawn and stops the same round being imported twice. It does not reserve the URL. Sensitive prose is `[withdrawn]`. Section 15. The contract does not say why the length is 730 × 24 hours. That motive is not documented. OGverse Lead owns clarification.

**Unconstrained citizenship.** The source says nationality is not a limit. `countries` is exactly `["*"]`. Citizenship does not exclude. Section 9.5.

**Unknown citizenship.** The source does not say. `countries` is exactly `[]`. The listing stays discoverable as `Check eligibility`. Section 9.5.

**Validator pass.** A run of the record check, the active-feed check, or the historical check that returns no errors. Section 18. OGverse Lead reports that a pass does not establish successful verification, genuine evidence, or release readiness. Product acceptance stays with OGverse Lead.

**WAT.** West Africa Time, UTC+1. The contract uses it for the 9 November 2026 approval date and for the `Africa/Lagos` fallback. A stated source zone replaces that fallback on a deadline. Section 10. Git commit times written in WAT are clock readings of commits. They are not chat approval times. OGverse Lead reports a chat time of 00:28 WAT on 9 November 2026 for the policy approval of `34969ab`. That report is not the git author time 00:25:31 WAT. Lead also reports direct approval of the corrected SHA at 00:42 WAT.

**Withdrawn.** `publication_status` `withdrawn`. The listing leaves active matching and keeps its id. Saved copies say Withdrawn. Section 15.

**Trusted caller.** A system or person allowed to supply a verification assessment. Today this means NaijaOpportunities' own server-side pipeline and signed-in staff reviewers only. Students, the public API and listing data never supply one.

**Human-review queue.** The offline list of ambiguous assessments waiting for a staff reviewer. A reviewer resolves each one with their reviewer id and a note naming what they read (contract section 13).

**human_resolved.** The status an ambiguous assessment gets when a reviewer accepts it. A rejected assessment stays failed.

**Active feed.** The list of listings that may be shown to students right now. The offline publisher builds it (Card 4); it is not yet served from a live endpoint.

**Exclusion reason.** Why a listing was left out of the active feed. There are five: ambiguous, failed, missing (no decision for that listing_id), stale (past verification.fresh_until) and expired_deadline (past a fixed deadline).

**Stale.** Past the listing's verification.fresh_until time. A listing whose time equals fresh_until is still active; one second later it is stale.

**Student profile.** The object PathSync matches listings against (contract section 11.3). A skipped answer is unknown, not a no.
