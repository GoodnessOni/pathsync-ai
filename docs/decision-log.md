# Listing decision log

This page records the listing decisions, the reasons the contract states, the motives it leaves undocumented, and the work handed on. The audience is a person who arrives about six months after 9 November 2026 and has not seen the original chats.

Words used here are defined in `docs/glossary.md`. If this page and the pinned contract disagree about a listing rule, the pinned contract wins. Reports of approval and of a released card are handover records. They are not listing rules, and they are not edits to the contract. This page does not approve, amend, or reject a product rule.

## How to read a sentence

1. Read the source label on the decision. Expected result: you know whether the sentence is from the pinned contract or from a report by OGverse Lead.
2. Open the cited section in the pinned file. Expected result: the contract text matches the rule below.
3. If the contract text differs on a rule, follow the contract and ask OGverse Lead to correct this page. Expected result: this page is not used as a second rulebook.

Two kinds of source are in use.

- **Pinned source.** `docs/data-contract.md` at commit `b50440dc738d86ff3070386d8709b8faf2bc5982` in `GoodnessOni/pathsync-ai`. The file URL is https://github.com/GoodnessOni/pathsync-ai/blob/b50440dc738d86ff3070386d8709b8faf2bc5982/docs/data-contract.md. The schema name is `ogverse.listings`, version `1.0.0`. A pinned SHA is that file at that commit. A branch name is not a pin.
- **Reported handover.** A statement OGverse Lead attributes to a chat with Goodness, or to the state of later work. This repository does not contain that chat. This page did not open the NaijaOpportunities repository. A reported sentence is not a signature written into the contract.

The contract's own labels remain in force. **Fact** means something observed in a named file. **Proposed** means a rule the contract would impose. **Agreed** and **Settled** are the contract's names for the decisions below. **Uncertain** means the contract author could not verify it. Section 22 lists those uncertainties again.

## Approval records

These records sit side by side. This page does not collapse them into one verdict, and it does not treat any of them as undoing the policy approval named in the file.

**Policy approval named in the pinned file.** Section 24 says Goodness approved policies 1 to 4, jobs, nationality, and time zone in commit `34969abca843462beb7b96ca1a7f3b4ffc723485` on 9 November 2026 (WAT). Section 5 says the later correction does not reopen those policies. Section 24 says the correction changes no policy. That policy approval remains the approval the file names.

**Reported chat time for that policy approval.** OGverse Lead reports that Goodness approved those policies at 00:28 WAT on 9 November 2026. This page has no transcript of that chat. The clock time is Lead's report. It matches the date section 24 already gives for `34969ab`. It is not the git author time of that commit, which is 00:25:31 WAT. The later report that Goodness approved corrected SHA `b50440d` at 00:42 WAT stays as it is.

**Git commit times, which are not chat approval times.** The git commit time of `34969abca843462beb7b96ca1a7f3b4ffc723485` is 00:25:31 WAT on 9 November 2026. The git commit time of `b50440dc738d86ff3070386d8709b8faf2bc5982` is 00:40:05 WAT on 9 November 2026. Those timestamps come from the commits' author dates, 23:25:31 UTC and 23:40:05 UTC on 8 November 2026, read in West Africa Time (UTC+1). They are not the time of a chat approval.

**Blank pin cell inside the same file.** Section 24 leaves "Approved corrected pin" blank. The file says this correction awaits final approval of the corrected pin, and that publishing the commit does not approve it. Section 20 leaves the lock's `git_sha` null and says the file's own SHA is named only when section 24 names it. Read that blank as self-referential metadata: the commit does not write its own SHA into itself. It is a different record from the external approval below.

**External approval reported by OGverse Lead.** Lead reports that Goodness directly approved corrected SHA `b50440dc738d86ff3070386d8709b8faf2bc5982` at 00:42 WAT on 9 November 2026. This page has no transcript and did not verify the chat. The report is not a line in section 24. It stands as Lead's report. It is distinct from the blank cell. It leaves the policy approval of `34969ab` in place.

## Decisions

### 1. Jobs stay in student matching

**Source.** Pinned contract, summary and section 5, "Settled — jobs stay in student matching". Section 2 calls this a settled rebuild instruction. The shipped README describes scholarships. That README sentence is a fact about the shipped product. It is not this decision.

**Rule.** `scholarship`, `internship`, and `job` can all reach PathSync match, letter, and deadline tracker when the rest of section 11 passes. A job with no degree requirement stays in matching. A job is shown as a job. `unrestricted` education does not exclude a job.

**Reason in the source.** The contract states the instruction and places jobs inside the rebuild's first priority. A further motive is not written. **Rationale not documented** beyond that instruction. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends or rejects the contract. Section 3 gives the owner that role. The correction says it does not reopen the settled instruction. This page does not add a review date.

### 2. Nationality is collected on onboarding

**Source.** Pinned contract, summary, section 5 "Settled — nationality and citizenship", and section 11.2.

**Rule.** Onboarding asks for `nationality`, one ISO 3166-1 alpha-2 code. It also collects institution, qualification studied, current level or year, course, and expected graduation date (`YYYY-MM-DD`). The student can update those answers. The screen that existed when the contract was written does not ask nationality, qualification, or expected graduation. The contract does not build that screen.

**Citizenship effect, from the section 5 table.**

| Listing value | Effect |
| --- | --- |
| `requirement` `explicit`, and the student's nationality is present and is not in `countries` | Exclude from that student's matches. Say why. |
| `requirement` `unconstrained` and `countries` is `["*"]` | Citizenship does not exclude. |
| `requirement` `unknown` and `countries` is `[]` | Keep the listing discoverable. Label `Check eligibility`. Do not claim a match. Do not hide it for this reason. |

A missing student nationality is unknown. Provider country, location, audience tags, and words such as "international" are not a citizenship requirement. The producer sets `explicit` only from an actual nationality list.

**Reason in the source.** The table states what the answer does. A motive beyond that table is not written. **Rationale not documented** beyond the table. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. Building the onboarding screen is a later product change. This contract does not authorise that screen.

### 3. Use the stated time zone, with West Africa Time only as the fallback

**Source.** Pinned contract, summary, section 5 "Settled — stated time zone", section 7, and section 10. Samples were measured with tzdata `2026e`, which `docs/listings/compute_listing_hashes.py` prints. The stored output is in section 16 and in `docs/listings/hash-output.txt`.

**Rule.** If the source names a zone, `stated_timezone` and `resolved_timezone` are that zone's canonical IANA name. A date-only deadline uses local time `23:59:59` and boundary `inclusive_end_of_local_day`. If the source names no zone, `stated_timezone` is null and `resolved_timezone` is `Africa/Lagos`. The contract says that is the only use of West Africa Time as a default. An explicit clock time stays that clock time. It is not moved to `23:59:59`. `fixed_at` is the UTC instant from the IANA conversion. The listing is open when `evaluation_time` equals `fixed_at`. It is expired when `evaluation_time` is greater. Rolling and unknown deadlines have no invented date.

**Measured examples in the pinned file.** No zone and "Closes 31 March 2027" resolves to `Africa/Lagos`, local `23:59:59`, `fixed_at` `2027-03-31T22:59:59Z`. "Closes 31 October 2026 (United Kingdom)" uses `Europe/London` and `fixed_at` `2026-10-31T23:59:59Z`. In the sample timezone data, `Africa/Lagos` is a fixed UTC+1 offset. The pinned evaluation instant `2026-11-08T12:00:00Z` is 13:00 in that zone.

**Rationale not documented.** The contract states the fallback. It does not say why `Africa/Lagos` is the zone used when the source names none. OGverse Lead owns clarification. This page adds no guess.

**Reconsider when.** Goodness amends the contract. A later timezone database can change a conversion. The samples at this SHA remain the measurements in section 16. A new measurement belongs to a new commit. This page does not authorise one.

### 4. Humans and automation share one seven-day freshness window

**Source.** Pinned contract, summary, section 5 "Agreed 1 — Freshness, 9 November 2026 WAT", and section 13.

**Rule.** Every listing on the active feed must have been successfully rechecked at least every seven days. Seven days means exactly 168 elapsed UTC hours after `verification.last_success_at`. It does not mean seven local midnights. `fresh_until` is that instant. The listing remains active when `evaluation_time` equals `fresh_until`. It is stale when `evaluation_time` is greater. A human success and an automated success start the same 168-hour window. There is no 90-day human exception.

A listing with `last_success_at` null is unverified and stays off the active feed. A successful check reads the official provider source and records open status, the deadline, eligibility, and the application link. HTTP success alone is not a successful check. `verification.evidence` must say what was read. An inconclusive or failed attempt is stored in `last_attempt_at` and `last_attempt_outcome`. It does not change `last_success_at` or `fresh_until`.

Explicit evidence of closed, withdrawn, or expired changes `lifecycle` immediately. That hide does not wait for `fresh_until`. Stale hides the listing from matching and keeps the history. Stale does not set `status` to `expired`.

NaijaOpportunities performs verification. PathSync applies the same freshness rule when it reads and matches. Automation does the routine check. Ambiguous, inaccessible, changed, or conflicting evidence is a human review. `reviewed_by` is `automation` or `human`. `reviewer_id` is set only for a human, and it is an opaque slug, not a student's name. A bot review must not be stored as `human`.

A stale listing returns to the active feed only after a new successful check whose outcome is `confirmed_open` and whose facts are still accurate. That success starts a new 168-hour window.

**Measured window.** Success at `2026-11-08T09:00:00Z` gives `fresh_until` `2026-11-15T09:00:00Z`. That instant is still active. `2026-11-15T09:00:01Z` is stale.

**Reason stated in the source.** "Trade-off: if the official source cannot be reached, a genuine listing can stay hidden. That is accepted so an unchecked listing is not shown as current."

**Rationale not documented.** The contract does not say why the window is seven days rather than another length. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. Section 5 says this correction does not reopen the agreed policy.

### 5. Unknown eligibility stays discoverable, and a confirmed mismatch is excluded

**Source.** Pinned contract, summary, section 5 "Agreed 2" and "Agreed 3", and section 11.2. The function result is `include`, `exclude(reason)`, or `needs_check(label)`. The contract checks in a fixed order and the first match wins. The order is the table in section 11.2. This page does not reorder it.

**Rule.** A confirmed fit is included. A confirmed mismatch is left out of that student's matches, with the reason. Unknown rules, or an incomplete profile on a restricted point, stay discoverable. The education label is `Check education eligibility`. The other unknown label in this policy is `Check eligibility`. Those results are not called eligible and they are not hidden.

Citizenship, education, demographics, and grade use that split. An unanswered demographic question is unknown. Sensitive demographic questions are optional, their purpose is explained, and nothing is inferred from a name or a photo. Nothing is inferred from the title or the provider. `preferences` never produce `exclude`. `audience_tags` never produce `exclude`. A match is guidance. `include` does not promise an award or a job.

Education: `unrestricted` does not exclude. `unknown` stays discoverable. `stages` of exactly `["secondary"]` is excluded from university students' matches. If several stages are listed, any one fitting stage is enough. A confirmed mismatch on a restricted point is excluded with the matching reason. A missing answer on a restricted point stays discoverable.

Grade: see decision 6. Course: a confirmed course mismatch is excluded with a reason. `Other`, or a course that is not in the contract's current onboard map, is not a confirmed mismatch. The map is section 11.2. The contract says mapping the current label `fishery` to `agriculture` is a reading of that control, not a claim about faculties.

**Reason in the source.** The outcomes say an unknown fact is not a "no", and it is not a claim that the student is eligible. The contract also says a match is guidance, not a guarantee. A motive beyond those sentences is not written. **Rationale not documented** beyond those sentences. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. If `frontend/src/pages/Onboard.jsx` changes the course or level labels, the section 11.2 map can go stale. That is a freshness check. It is not permission to edit the map from this page.

### 6. Compare a grade only on the same stated scale

**Source.** Pinned contract, summary, section 5 Agreed 3, section 9.5 `grade`, section 11.2, and section 24. Section 24 says the correction is "CGPA compares one stated scale only" and "No new policy."

**What the correction repaired.** Commit `34969ab` already said unlike scales are not converted. The same file still contained a cross-scale formula. The pinned text removes that formula. The current rule is the text at `b50440d`.

**Rule.** `grade.requirement` `explicit` applies only when the student supplies a grade on the same `scale`. Scales in the field table are `4.0` and `5.0`. `minimum_hundredths` is an integer on that scale. 350 means 3.50. Unlike scales are not converted. A degree class is not turned into a CGPA. Hundredths avoid binary floats on one stated scale.

Worked results in section 11.2, for scale `5.0` and minimum 350:

1. Student 360 hundredths on `5.0`. Expected result: the grade rule does not exclude.
2. Student 300 hundredths on `5.0`. Expected result: `exclude(grade)`.
3. Student 320 hundredths on `4.0`. Expected result: `needs_check(Check eligibility)`. The contract says not to multiply by 5/4, not to treat 320 as 400, and not to call the student eligible.

A missing or ambiguous grade, scale, course, or requirement stays discoverable with `Check eligibility`. `grade.requirement` `none` does not exclude.

**Reason in the source.** Section 24 presents this as a wording repair of the approved policy. A further motive for refusing conversion is not written. **Rationale not documented** beyond that repair. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. Ranking is a different matter. Decision 11.

### 7. The same round keeps its id, and a new round gets a new id

**Source.** Pinned contract, summary, section 5 "Agreed 4", section 9.4, section 15, and section 16 step 6.

**Rule.** `listing_id` is assigned once for one round and is never reused, including after withdrawal. PathSync may keep a local UUID. That UUID is not `listing_id`.

`dedupe_key` is the SHA-256 hex of UTF-8 `kind`, a newline, `provider_key`, a newline, `opportunity_key`, a newline, and `round_key`. The application URL is not an input. The same `dedupe_key` is the same round. A second `listing_id` with that key is `duplicate_listing`.

The same round restored or reopened keeps the same `listing_id` after a successful verification, and `revision` increases. A changed application link on that same round also keeps the id and increases the revision. A new annual or application round is a new `listing_id` even if `application.url` is reused. `previous_round_id` names the earlier id only when the producer confirms the link. The link alone does not decide identity.

An update is the same id. `revision` becomes the stored revision plus 1. `updated_at` increases. `content_hash` changes. The same revision and the same hash is an idempotent replay. The same revision and a different hash is `revision_conflict`.

**Reason in the source.** The contract says the application URL must not block a new round or force two rounds into one id, and that the link alone does not decide identity. A motive beyond those sentences is not written. **Rationale not documented** beyond those sentences. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. Section 5 says this correction does not reopen the agreed policy.

### 8. A 730-day minimal tombstone does not reserve the URL

**Source.** Pinned contract, summary, section 5 Agreed 4, and section 15.

**Rule.** A withdrawn listing leaves active matching and keeps its `listing_id`, history, reason, and `withdrawn_at`. A saved PathSync row displays Withdrawn. Withdrawn, expired, and stale stay different.

For 730 × 24 hours after `withdrawn_at`, the producer keeps a minimal tombstone in the historical feed. The contract states two purposes: a consumer can mark saved copies Withdrawn, and the same round is not imported again as a second id. That retention does not reserve the URL. A new `round_key` may be published at once. The tombstone does not keep sensitive or personal text.

Tombstone text in section 15: `summary`, `description`, `how_to_apply`, and `eligibility.criteria_text` are exactly `[withdrawn]`. `education.source_wording` is `[withdrawn]`. `criteria_stated` is false. `documents_required` is `[]`. `award` is `not_stated`. `contact_email` is null. Title, provider, deadline facts, ids, and URLs stay. `title` is not `[withdrawn]`.

After those 730 days the tombstone may leave the feed. Reconciliation then uses kind, `provider_key`, `opportunity_key`, and `round_key`. If either side still knows the old `listing_id` for that round, the restore uses that id. A new id is only a last resort when nobody still has the id. It must not be minted merely because the URL looks familiar.

The tombstone sample passes `validate_record` and `validate_historical`. It fails `validate_active_feed` with `not_on_active_feed` on `lifecycle.status`.

**Reason stated in the source.** The two purposes in the paragraph above are the contract's stated purposes.

**Rationale not documented.** The contract does not say why the retention length is 730 × 24 hours rather than another length. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. The sentence that the tombstone may leave the feed after that period is already the rule. This page does not choose a different length.

### 9. The application URL may change on the same round

**Source.** Pinned contract, section 9.4, the summary withdrawal paragraph, section 15, and section 24.

**What the correction repaired.** In `34969ab`, the agreed paragraph already said `application.url` may change on a later revision of the same round. The field table in that commit still said the URL was immutable for a `listing_id`. Those sentences conflicted. The pinned field cell says: accepted `https` URL, section 12; not an identity; the same round may change it on a later revision. Section 24 names the change as "Application URL is not immutable" and says there is no new policy.

**Rule at the pin.** `application.url` is the best next page for the student. `source.url` is the page the facts were taken from. They may differ. Neither is the listing's identity. `application.url` may change on a later revision of the same round. A changed link does not by itself create a new `listing_id`. A new round does, even when the link is unchanged. The same round keeps the same `dedupe_key` when the URL changes. A new round changes the `dedupe_key` even when the URL does not.

PathSync uses an "Apply" label only when `url_kind` is `direct_application` or `official_programme_page`. For `aggregator_page` and `unknown` the label is "Source page".

**Reason in the source.** Section 24 calls this a contradiction repair. The identity rule is the agreed sentence that the link alone does not decide identity. A motive beyond that repair and that sentence is not written. **Rationale not documented** beyond those sentences. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract.

### 10. Acceptance and normalisation are different operations

**Source.** Pinned contract, section 12, section 16 step 4, and the measured lines in section 16. The runnable check for the fixtures is `accept_url` in `docs/listings/compute_listing_hashes.py`. The contract says that script is not a product validator. `normalise_url` in the same script is the helper.

**What the correction repaired.** The earlier section mixed "must be canonical" with producer stripping of tracking keys. The pinned section says the two operations are not interchangeable. Section 24 says section 12 separates acceptance from normalisation, and that this is not a new policy.

**Acceptance.** A stored `source.url`, `application.url`, non-null `provider.url`, and non-null `verification.source_checked_url` must already be an accepted URL. The check returns `non_canonical_url` on that field. It does not rewrite the string. The checks do not resolve DNS and do not fetch the URL.

An accepted URL, in the contract's order:

1. It contains no ASCII whitespace. Expected result: a space in the string fails acceptance.
2. It starts with `https://` and has no second scheme. Expected result: `http://` fails with reason `scheme`.
3. It has no userinfo, no fragment, and no port, including `:443`. Expected result: those forms fail with `userinfo`, `fragment`, or `host`.
4. The host is lowercase dot-separated labels. Each label matches `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`. The host is not an IPv4 literal, `localhost`, a name ending `.localhost`, `example.com`, `example.org`, `example.net`, or a name ending in those three suffixes.
5. A host ending `.example` is accepted syntax so the synthetic fixtures have a legal string. A production row must still be the host that was fetched. Acceptance does not check that duty.
6. The path is empty, with no slash after the host, or one or more segments of `/` plus `[A-Za-z0-9._~-]+`. There is no trailing slash, no empty segment, and no `.` or `..` segment. Path case is kept.
7. A query, if present, is `?` plus `key=value` pairs separated by `&`. Keys match `^[a-z0-9._~-]+$`. Values are empty or match `[A-Za-z0-9._~-]` and `%` plus two uppercase hex digits. Pairs are sorted by key, then value, and keys are unique. These keys are rejected: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`, `igshid`, `ref`.

The contract's measured accepted strings are `https://apply.rivertrust.example/2027`, `https://rivertrust.example`, and `https://apply.rivertrust.example/Path?a=1&b=2`. The rejection table in section 12.1 is the measured reason list. The stored record stays the rejected string.

**Normalisation.** A producer may prepare a raw link before storing it. `normalise_url` lowercases the host, drops a trailing slash, drops the tracking keys above, sorts the query, and removes a fragment. It does not accept the input. If someone stores the raw string, `accept_url` still rejects it. Section 12.2 is titled "Normalisation is not acceptance."

Measured oracle, which the contract says is not a stored listing:

1. Input `https://Apply.River.Example/Path/?utm_source=x&b=2&a=1`. Expected result: `accept_url` rejects it.
2. `normalise_url` returns `https://apply.river.example/Path?a=1&b=2`. Expected result: that output passes `accept_url`.
3. The input does not become the record by being normalised. Expected result: the stored field is the accepted string the producer chose to store, and the check does not rewrite a raw value in place.

**Reason in the source.** The contract says the two operations are not interchangeable, and the correction separates them so a raw string is not treated as accepted. A motive beyond that separation is not written. **Rationale not documented** beyond that separation. OGverse Lead owns clarification.

**Reconsider when.** Goodness amends the contract. The error name `non_canonical_url` remains the contract's name for an acceptance failure. This page does not rename it.

### 11. Preference ranking is undefined and out of scope

**Source.** Pinned contract, summary, section 5 Agreed 3, and section 22 item 14. The handover from OGverse Lead puts ranking outside the validator card.

**Rule.** `demographics.preferences` may affect ranking and never hard-exclude. The ranking formula is not defined in the contract and is not an agreed rule. It is outside the validator card. This page does not supply a formula.

**Reason in the source.** The contract states that the formula is absent. **Rationale not documented** for how a future formula should work. OGverse Lead owns clarification until Goodness amends the contract.

**Reconsider when.** Goodness approves a later contract that defines the formula.

## Handover

**What the pinned file says about the card.** Section 18 describes the first card as a listings validator in `GoodnessOni/naija-opportunities`, measured against this document. The done test in that section is: the five valid fixtures pass `validate_record`, and a missing required field, an invalid type, and an expired deadline each fail with an error that names the field. Section 18 says that card is not started. Section 20 says the card pins the corrected commit only after section 24 names that SHA, and the lock in this file keeps `git_sha` null. Section 24 says no planner card may start while that cell is blank. Those sentences are the file at this SHA. They are the same self-referential metadata as the blank pin cell.

**What OGverse Lead reports now.** Lead reports that the validator card has been released with a lock of exact SHA `b50440dc738d86ff3070386d8709b8faf2bc5982`. An earlier note in this handover said the card was ready for Lead review and had not been dispatched. This page follows Lead's later report. The report is attributed to OGverse Lead. This page does not assert that a validator was implemented, run, merged, or checked. This work did not open https://github.com/GoodnessOni/naija-opportunities and did not read branch `rebuild/listings-validator`.

Ranking stays undefined and outside that card. Decision 11.

Architecture decisions `docs/decisions/0001-hosting.md` and `docs/decisions/0002-embedding-model.md` are a different set of records. The listings contract says hosting and embeddings are not settled in it. This log does not change those files. `docs/changelog.md` is the existing changelog. The 1 November 2026 notes in it are unchanged. This log does not replace that file.

## What is known, unknown, and who answers

| Item | State | Answer owner |
| --- | --- | --- |
| Listing rules at `b50440d` | Known from that blob. | The contract. Goodness approves amendments. |
| Policy approval of `34969ab` | Named in section 24. Still the policy approval the file records. | The contract text. |
| Policy-approval chat time 00:28 WAT on 9 November 2026 | Reported by OGverse Lead for `34969ab`. Distinct from the git author time 00:25:31 WAT. Not verified from a transcript here. | OGverse Lead. |
| Git times 00:25:31 WAT and 00:40:05 WAT on 9 November 2026 | Known commit timestamps. Not chat approval times. | Git history of this repository. |
| Blank "Approved corrected pin" cell | Known metadata inside the pinned file. The file does not cite its own SHA. | No one fills it from this page. |
| Direct approval of SHA `b50440d` at 00:42 WAT on 9 November 2026 | Reported by OGverse Lead. Not verified from a transcript here. | OGverse Lead. |
| Validator card released with lock SHA `b50440d` | Reported by OGverse Lead. Implementation is not asserted here. | OGverse Lead. |
| Preference ranking formula | Undefined. Out of the validator card's scope. | Goodness, through a later contract. OGverse Lead owns clarification meanwhile. |
| Why seven days, why 730 × 24 hours, why `Africa/Lagos` | Rules are known. Motives are not documented. | OGverse Lead. |
| Live database rows, scraper schedule, and canonical public hostname | Uncertain in section 22. | Left unknown by the contract. |

## Freshness check

Do this before relying on the handover. The blob at `b50440d` does not change. Reports and later commits do.

1. Open section 24 of `docs/data-contract.md` at SHA `b50440dc738d86ff3070386d8709b8faf2bc5982`. Expected result: "Approved corrected pin" is blank in that blob, and the policy row still names `34969ab`.
2. Read the blank cell as metadata inside that commit, the 00:28 WAT figure as Lead's reported policy-approval chat time, and the 00:42 WAT figure as Lead's report of the corrected SHA. Expected result: you keep 00:25:31 WAT as the git author time, and you do not treat the blank cell as wiping out either reported approval.
3. Ask OGverse Lead whether the reported validator release, with lock SHA `b50440d`, is still the handover they mean. Expected result: Lead confirms or corrects the report. You still do not treat this page as proof that the validator ran.
4. Ask OGverse Lead if you need the motive for seven days, for 730 × 24 hours, or for the `Africa/Lagos` fallback. Expected result: Lead supplies it, or confirms it is still undocumented. You do not fill the gap yourself.
5. Compare the course and level labels in `frontend/src/pages/Onboard.jsx` with section 11.2 of the pin. Expected result: you notice drift. You do not edit the contract from this page.
6. Leave the ranking formula undefined. Expected result: no score is invented for the validator card.

## Steps for the next reader

1. Read the glossary once. Expected result: the field names on this page have plain meanings.
2. Read decisions 1 to 11 against the pinned sections. Expected result: you can repeat each rule without adding a rule.
3. Keep the approval records in the section above as separate records. Expected result: 00:28 WAT stays Lead's reported chat time for the policy approval, 00:25:31 WAT stays the git author time, the blank cell stays file metadata, the 00:42 WAT report stays Lead's report of the corrected SHA, and the `34969ab` policy approval stays in place.
4. Treat the validator release as Lead's report of 9 November 2026. Expected result: you know who to ask, and you do not claim the implementation was checked from this repository.
5. Ask OGverse Lead before you publish this page, dispatch further work, merge, deploy, or spend. Expected result: the owner answers. This page stays a record until that approval is given.
