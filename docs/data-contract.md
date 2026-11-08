# Listings data contract

## Plain-English summary

This document is the listings agreement between PathSync and NaijaOpportunities. The whole contract is still pending Goodness's approval. No planner card starts until the approval record names a git commit. Three points below are already decided. They are instructions, not questions.

PathSync helps Nigerian university students find scholarships, internships, and jobs, then prepare a letter, a CV, and a deadline plan. It does not send the application. NaijaOpportunities produces the listings. PathSync reads them. Today they do not share one record: PathSync stores scholarships locally, a deadline is a date or empty, and empty is treated as still open. NaijaOpportunities keeps jobs and scholarships apart and identifies a row by its link. This contract uses one record instead. The live databases were not opened. There is no count of listings that lack citizenship.

Jobs stay in student matching. A job is shown as a job. It is not dropped for its kind, and it is not relabelled as a scholarship.

Onboarding will ask each student for nationality. That screen is specified here and is not built in this change. PathSync withholds a listing for citizenship only when the listing gives an explicit list of allowed nationalities and the student's nationality is not on it. That is a confirmed mismatch. If the source says nationality is unconstrained, the listing stays. If the source never says, the metadata is unknown and the listing stays. The provider's country, the word "international", and a blank field are not a mismatch.

A fixed deadline stores the zone the source stated, the source words, and the UTC instant those words resolve to. A date with a named zone ends at 23:59:59 in that zone. West Africa Time (Africa/Lagos) applies only when the source gave no zone. An explicit clock time is that time in the stated zone, not the end of the day. The listing is open through that exact second and expired on the next one. Offsets and daylight-saving time come from the IANA timezone data. A spring-forward gap is rejected rather than shifted. A repeated autumn time uses the earlier occurrence. Rolling and genuinely unknown deadlines contain no invented date. Checks use a supplied evaluation instant, not the wall clock.

Four proposals still need a decision.

Freshness. A machine-checked listing would leave the active feed 7 days after its last check, and a human-checked listing after at most 90 days. The row stays in history. Stale is not the same as past the deadline.

Education. A scholarship or internship with an unknown education level would stay off the student feed. A job marked not applicable would not. Secondary-school-only listings would stay off this university product.

Demographics and marks. Tags such as women students or a region would not hard-block a student who left the box unticked. A missing CGPA or course hides a listing only when both sides give a value and the student falls short.

Withdrawal. A removed listing keeps its id. The same application link would stay reserved for 730 days.

The five samples are synthetic. Their hashes come from running `docs/listings/compute_listing_hashes.py`. Approval accepts these four proposals or records amendments. Until a commit is named, no card starts.

| Item | Value |
| --- | --- |
| Document | `docs/data-contract.md` |
| Owner repository | `GoodnessOni/pathsync-ai` |
| Author role | OGverse Lead |
| Status | **PROPOSED — pending owner approval** |
| Schema | `ogverse.listings` `1.0.0` |
| Authored | 8 November 2026 |
| Pinned evaluation instant used by every sample | `2026-11-08T12:00:00Z` (13:00 Africa/Lagos, WAT, UTC+1) |
| Approval | Not granted. This file does not record an approval. |

This is the lead's contract for listings. It is not a planner card, not a validator, and not product code. No card may start until Goodness approves this document. Approval means Goodness accepts this text, or a later commit replaces it and names the accepted git SHA. The jobs, nationality, and time-zone rules in the summary are settled instructions. The other normative rules are proposals until that approval.

The first card after approval, and not before, is a listings validator in the NaijaOpportunities repository against a pinned SHA of this file. That card is done when the valid samples in this document pass and a missing required field, an invalid type, and an expired deadline each fail with an error that names the field. This document does not start that card and does not change the NaijaOpportunities repository.

`docs/changelog.md` on this branch is not updated here, because this task may change only this file. The changelog therefore does not mention this contract.

## 1. How to read this document

Three labels are used whenever a sentence could be mistaken for a fact:

- **Fact.** Observed in a named file in this repository, or in the public `GoodnessOni/naija-opportunities` tree at the SHA named in section 4. Facts are not a promise that the live Supabase projects still match those files.
- **Proposed.** A rule this contract would impose if approved. Samples, field tables, and the validator are proposed.
- **Uncertain.** Something this lead could not verify. Uncertainties are collected again in section 22. They are not filled in with guesses.

Normative words "MUST", "MUST NOT", "SHOULD", and "MAY" apply only to proposed rules. Examples are synthetic. Hosts under the `.example` TLD are documentation names (RFC 2606). They are not claims that a programme, employer, or URL exists.

The producer validator and the PathSync student-surface filter are different functions. A listing can be schema-valid and still be withheld from students.

## 2. Purpose and scope

### Purpose

**Fact.** The PathSync README describes PathSync AI as an AI-powered scholarship discovery, matching, and application system for Nigerian university students. It names a discovery interview, a hidden-achievement reading of everyday student language, scholarship matching, an application letter, a CV, a deadline tracker, and a privacy gateway that is supposed to keep identifiers away from the model. The same README's product sentence says the system finds scholarships, writes the letter, builds the CV, and tracks deadlines, and that it does not submit the application.

**Proposed.** Priority 1 of the OGverse rebuild is PathSync for Nigerian university students who are finding and applying for scholarships, internships, and jobs. Jobs stay in student matching. PathSync reads listings that NaijaOpportunities publishes. Priority 2 is a NaijaOpportunities rebuild that keeps scholarships, internships, and jobs accurate and current, and that publishes them under this consumer contract. The two products stay in separate repositories. This file is the contract between them. The README fact above describes the product as shipped: scholarships. Jobs in matching is the settled rebuild instruction.

The contract exists so a student is not shown a closed listing, a fabricated deadline, or a placeholder provider, and so a job stays a job inside matching. A later validator must be able to accept or reject a listing without calling the wall clock.

### In scope

One JSON listing shape for `scholarship`, `internship`, and `job`. Identity, eligibility, provenance, URLs, freshness, lifecycle, deduplication, update, withdrawal, timestamps, schema versions, a proposed sync shape, privacy of listing text, deterministic validation, and the PathSync filter that decides which valid listings reach match, letter, and deadline-tracker surfaces.

### Out of scope

Matching scores, embeddings, model choice, hosting, the student-profile database, chat, CV and letter prompts, scraper implementation, and HTTP servers. The hash script and synthetic fixtures in section 16 are documentation for this contract, not a product validator. Architecture decision 0001 (hosting) and architecture decision 0002 (embeddings) are not settled here. `docs/data-model.md` on this branch is still a placeholder and is not this contract. Onboarding nationality is specified as consumer policy and is not implemented.

## 3. Parties and responsibilities

| Party | Repository | Proposed responsibility |
| --- | --- | --- |
| Producer | `GoodnessOni/naija-opportunities` | Create and update listings. Assign stable ids. Classify kind, eligibility, deadline kind, and URL kind honestly. Run the producer validator before a listing is published. Retain expired and withdrawn history. Never invent a date. |
| Consumer | `GoodnessOni/pathsync-ai` | Read listings. Re-validate before showing them. Apply the student-surface filter. Generate letters, CVs, and deadline plans only from listings that pass that filter. Never write student personal data back into a listing. |
| Owner | Goodness | Approve, amend, or reject this contract. No planner card starts without that approval. |
| Lead | This document's author | Write the contract. Do not implement it in this change. |
| Planner | Later, other task | Turn an approved contract into ordered cards with done tests. The planner does not rewrite the contract and does not write product code. |

**Proposed.** The producer is the source of listing facts. PathSync may store a local copy and a local surrogate key, but the sync key is `listing_id`. PathSync MUST NOT treat its `scholarships` table, its seed rows, or a model paraphrase as a second source of truth.

**Proposed.** PathSync does not submit applications. A URL is a link the student may open. Publishing a listing is not an endorsement beyond the verification state printed on the record.

## 4. Current state versus this proposal

### 4.1 What the PathSync README and this repository actually do

**Fact.** README product features are scholarships, not internships and not jobs. The dashboard copy in `frontend/src/pages/Dashboard.jsx` tells the student that NaijaOpportunities "updates daily with new scholarships and jobs" and links to `https://naija-opportunities.vercel.app/scholarships`. `frontend/src/components/Header.jsx` and `frontend/src/pages/Landing.jsx` link to `https://naija-opportunities.vercel.app`. Those are outbound links, not a listings client.

**Fact.** There is no checked-in HTTP client that fetches a NaijaOpportunities listings API. `POST /api/v1/scholarships/ingest` (`backend/app/api/scholarships.py`) accepts a local body and `ingest_scholarship` inserts into the local `scholarships` table. A comment in that file says matches are fetched "from NaijaOpportunities", but the SQL reads local `scholarships`. Commit `5807fbe` ("indexing from naija opportunities", 8 May 2026) changes match ranking and the result limit. It does not add a remote fetch.

**Fact.** `backend/schema.sql` defines `scholarships` as: `id` UUID default `gen_random_uuid()`, required `title`, `provider`, `description`, `eligibility_criteria`, nullable `min_cgpa` `NUMERIC(3,2)`, nullable `eligible_majors` `TEXT[]`, nullable `amount` text, nullable `deadline` `DATE`, nullable `application_url`, `embedding vector(1536)`, `created_at`, `updated_at`. There is no kind, no source URL, no verification time, no publication status, and no external stable id. The SQL function `match_scholarships` does not filter on `deadline`. The four seed rows use calendar dates `2026-06-30`, `2026-07-31`, `2026-08-01`, and `2026-09-15`. All four are before 8 November 2026. Whether those rows exist in the live database was not checked. The seed URLs were not opened.

**Fact.** The same repository does not agree with that schema. `backend/app/api/matches.py` selects `country`, `level`, `eligibility`, `benefits`, `apply_url`, `documents_needed`, and `duration` from `scholarships`. `backend/app/api/scholarships.py` and `backend/app/services/rag_service.py` write `eligibility_criteria` and `application_url`. Those are different names for the same product.

**Fact.** Deadline checks that do exist call the clock and treat a missing deadline as still open. `matches.py` and `scholarships.py` use `datetime.now().date()` with `deadline IS NULL OR deadline >= that date`. `frontend/src/pages/Matches.jsx` keeps a match when `deadline` is missing, and otherwise compares `new Date(deadline)` with `new Date()`. Deduping in that page is `title` plus `provider`, not an id. `docs/audit/rag_service.md` (1 Nov 2026) records that the RAG match path's only hard post-filter is CGPA and that an expired scholarship can be returned.

**Fact.** Onboarding in `frontend/src/pages/Onboard.jsx` asks for university, course, level (`100L`, `200L`, `300L`, `400L`, `500L`, `Postgraduate`), CGPA on a 5.0 or 4.0 scale, optional demographics (female student, disability, first-generation, low-income, Northern Nigeria, Niger Delta, rural), leadership, projects, goal (`fund_education`, `study_abroad`, `build_career`), and a free-text about. Several of those columns are used by the app and are not in `schema.sql`. The live column list was not queried.

**Fact.** `docs/decisions/0002-embedding-model.md` records, on 1 Nov 2026, that the scholarships table then held 72 vectors of 1024 dimensions and that a jobs table had no embedding column. This lead did not re-query Supabase. The README architecture diagram still says `vector(1536)`. That conflict is untouched. This contract does not carry embeddings.

**Fact.** `docs/runbook.md` says the NaijaOpportunities scraper schedule has been disabled since 19 August 2026 and points at an inventory that is not in this repository. The public workflow file still contains a 6-hour cron (section 4.2). Which of those describes production on 8 November 2026 is **uncertain**.

### 4.2 What the public NaijaOpportunities repository actually publishes

Observed 8 November 2026, read-only, default-branch tip commit `c737b4f` (20 June 2026). Scraper blob SHA `2255543243fa42e6f2dfabed8da94fa3de11689d`. This task did not modify that repository, did not run the scraper, and did not query its database.

**Fact.** The README describes jobs and scholarships updated by a scraper, Next.js, Supabase, and GitHub Actions. It names two public hosts: `naija-opportunities.vercel.app` and `www.naijaopportunities.live`. It does not describe an internships feed or a listings JSON API. The checked-in `app/api` routes found were contact and image-proxy only.

**Fact.** `scraper/scraper.py` upserts jobs on `apply_url` into table `jobs` and scholarships on `apply_url` into table `scholarships`. There is no separate internship table. The word "internship" appears in an enrichment prompt as a benefit, not as a listing kind. Job builders that were inspected set `deadline` to `None`. Jobberman, WeWorkRemotely, and the Google News jobs builder set `company` to `See listing`. RemoteOK uses the payload company or the fallback `Remote`. The scholarship builders set `provider` to `Various`, `level` to `various`, and `country` to `International` or `Nigeria`.

**Fact.** Enrichment asks a model for `deadline` as `YYYY-MM-DD` or null, then turns the strings `Not specified`, `Not available`, `Varies`, and `null`, and any string whose length is not 10, into `None`. Unknown, rolling, and unparsed deadlines therefore become the same database null. A null is not a stated rolling deadline, and it is not evidence that a human checked the page.

**Fact.** `app/scholarships/page.tsx` selects scholarships with `deadline IS NULL OR deadline >= today`, where `today` is `new Date().toISOString().split('T')[0]` (the UTC calendar date), and orders by `created_at` descending. A null deadline stays on that page. Urgency uses `Date.now()`. The TypeScript `Scholarship` interface lists `id`, `short_id` (number), `title`, `provider`, `country`, `level`, `source`, `apply_url`, `deadline`, `description`, `amount`, `slug`, and `image_url`. `short_id` and `slug` are not keys in the scraper dictionaries that were inspected. How they are assigned is **uncertain**. Page links are built with `makeSlug(title, short_id)`, which lowercases the title, drops non-alphanumerics, cuts to 40 characters, and appends `short_id`. That slug changes when the title changes. It is not a stable id.

**Fact.** `app/jobs/page.tsx` selects all jobs ordered by `created_at` descending. The inspected query does not filter `deadline`. The `Job` interface lists `id`, `short_id`, `title`, `company`, `location`, `type`, `source`, `deadline`, `description`, `salary`, and `image_url`.

**Fact.** `.github/workflows/scraper.yml` at that commit declares `cron: '0 */6 * * *'` and `workflow_dispatch`. A cron entry in git is not proof that GitHub is running it. No SQL schema file was in the repository, so database nullability and primary keys are **uncertain** beyond the TypeScript interfaces and the scraper payloads.

### 4.3 Proposed decisions that replace those behaviours

| Current behaviour | Proposed rule |
| --- | --- |
| URL or title+provider identifies a row | `listing_id` is stable. `apply_url` is not the id. Title slugs are display-only. |
| One scholarships table and a separate jobs shape | One listing object. `kind` is `scholarship`, `internship`, or `job`. |
| Null deadline means several different things | `deadline.kind` is `fixed`, `rolling`, or `unknown`. No fabricated date. |
| `DATE` plus the server clock or the browser clock | A caller-supplied `evaluation_time`. A date-only deadline ends at 23:59:59 in the source's stated zone. Africa/Lagos is used only when the source states no zone. |
| Expired rows can remain in match results | Active feed rejects an open listing whose fixed deadline has passed. Historical feed keeps the same facts once `status` is `expired`. |
| Upsert on URL, no tombstone | Revisioned updates. Withdrawal is a tombstone. Ids are not reused. |
| `Various`, `See listing`, free-text amount | Named provider, structured award, honest `url_kind`. |
| No schema version | `schema_version` `1.0.0` and the compatibility rules in section 6. |
| No sync API | Section 19 is a proposed logical operation. It is not a live endpoint. |

## 5. Settled instructions and remaining decisions

The plain-English summary at the top is the owner-facing list. This section is the same split in the words the rest of the contract uses. The whole document is still pending approval. The three settled instructions are not questions.

### Settled — jobs stay in student matching

**Settled instruction.** `scholarship`, `internship`, and `job` are all eligible for PathSync match, application letter, and deadline tracker when the rest of section 11 passes. A job is shown as a job. `kind` is never a reason to drop it. `goal` does not have to be `build_career`. The outbound link to NaijaOpportunities can remain; it is not a substitute for matching.

### Settled — nationality, explicit requirements, unknown metadata, confirmed mismatch

**Settled instruction.** Onboarding asks the student for `nationality`, one ISO 3166-1 alpha-2 code. `frontend/src/pages/Onboard.jsx` does not ask that today. This contract does not change that screen.

Four meanings stay separate:

| Meaning | Where it lives | Effect on matching |
| --- | --- | --- |
| Nationality | Student profile, not the listing | The country the student states |
| Explicit citizenship requirement | `eligibility.citizenship.requirement` = `explicit` and `countries` is a list of ISO codes | Withhold only when the student's nationality is present and is not in `countries` |
| Unconstrained | `requirement` = `unconstrained` and `countries` is `["*"]` | Do not withhold for citizenship |
| Unknown listing metadata | `requirement` = `unknown` and `countries` is `[]` | Do not withhold for citizenship |

A confirmed mismatch is only the explicit-list case. Provider country, location country, audience tags, and words such as "international" or "Africa" do not create a requirement and do not create a mismatch. If onboarding has not stored a nationality yet, an explicit list is not a confirmed mismatch, because the consumer cannot yet say the student lacks it.

### Settled — stated zone, and West Africa Time only when no zone is given

**Settled instruction.** Section 10 is the rule. A date-only deadline with a stated IANA zone ends at 23:59:59 in that zone. Africa/Lagos (WAT, UTC+1, no daylight-saving transition in current IANA data) is the resolved zone only when `stated_timezone` is null. An explicit clock time uses that clock time, not end of day. The stored `fixed_at` is the UTC instant of that local time. The listing is open at `fixed_at` and expired when `evaluation_time` is greater than `fixed_at`.

Rolling stays `rolling`, with the source sentence and with every date and zone field null. Unknown stays `unknown`, with those fields null. Neither is expired, and neither is given a guessed day.

An open listing whose `fixed_at` is before `evaluation_time` is rejected from the active feed. The error names `deadline.fixed_at`. The same instant is kept on the historical feed only after `lifecycle.status` is `expired`.

### Still needs Goodness

These four are proposals. They are not settled by the instructions above.

1. Freshness: 168 hours after `verification.last_checked_at` for `machine_checked` and `unverified`, and at most 2160 hours for `human_verified`. After `fresh_until`, an open listing leaves the active feed with `stale_listing` on `verification.fresh_until` and stays in history.
2. Education: `education_levels` of `["unknown"]` withholds a scholarship or internship. It does not withhold a job. `["not_applicable"]` does not withhold any kind. `["secondary"]` withholds every kind from this university product.
3. Demographics are stored and are not a hard exclude. CGPA and course exclude only when both sides state a comparable value and the student is outside it. A missing CGPA or course does not hide the listing.
4. After withdrawal, `dedupe_key` stays reserved for 730 × 24 hours.

## 6. Schema identity, versioning, and compatibility

**Proposed.**

- The schema name is `ogverse.listings`. This version is the string `1.0.0`. `schema_version` MUST equal `1.0.0` on every listing that claims to follow this document.
- Versions are `MAJOR.MINOR.PATCH`, numeric components, no prefix.
- PATCH may correct wording that does not make a previously valid listing invalid and does not make a previously invalid listing valid.
- MINOR may add optional fields. This 1.0.0 document has no optional top-level fields. A minor version is how a later optional field appears.
- Adding a required field, removing a field, renaming a field, or tightening a constraint is a MAJOR bump.
- The producer validator for 1.0.0 MUST reject unknown fields (`unknown_field`). That keeps the producer from drifting.
- The PathSync reader MUST ignore unknown fields and MUST accept any `1.x.y` listing that satisfies the 1.0.0 required fields and constraints. The reader MUST reject a different major with `unsupported_schema_version` on `schema_version`.
- A pinned SHA identifies the text. A branch name does not. Section 20 says how the pin works.

## 7. Clocks, timestamps, and evaluation time

**Proposed.** Every timestamp in a listing is a JSON string matching

`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$`

and is a real UTC instant (Gregorian calendar, leap days included, hour 00–23, minute and second 00–59). Offsets other than `Z`, fractional seconds, and naive datetimes are invalid. Because the form is fixed width, chronological order is the same as byte order.

`evaluation_time` is an argument to the active-feed and historical validators and to the PathSync filter. It uses the same timestamp form. Expiry compares that instant with the stored `fixed_at`. Those comparisons MUST NOT read the wall clock or the network. Resolving a local date or clock time into `fixed_at` uses the IANA timezone database through Python `zoneinfo`. The measured samples in this revision used tzdata `2026e`, which is what `docs/listings/compute_listing_hashes.py` prints. The samples are defined at

`CONTRACT_EVALUATION_TIME = 2026-11-08T12:00:00Z`

Africa/Lagos in that timezone data is a fixed UTC+1 offset. It is not the zone for every listing. It is the default only when the source names no zone.

Adding hours means the unique UTC timestamp that many elapsed seconds later. Sample oracles:

| Start | Hours | Result |
| --- | ---: | --- |
| `2026-11-08T09:00:00Z` | 168 | `2026-11-15T09:00:00Z` |
| `2026-11-01T00:00:00Z` | 168 | `2026-11-08T00:00:00Z` |
| `2026-11-08T10:00:00Z` | 2160 | `2027-02-06T10:00:00Z` |

Worked deadlines, each instant measured by the script in section 16:

No zone, date only. The source says "Closes 31 March 2027" and gives no clock time and no zone.

- `form` = `date_only`
- `stated_timezone` = null
- `resolved_timezone` = `Africa/Lagos`
- `local_time` = `23:59:59`
- `boundary` = `inclusive_end_of_local_day`
- `fixed_at` = `2027-03-31T22:59:59Z`
- Open when `evaluation_time` is `2027-03-31T22:59:59Z`
- Expired when `evaluation_time` is `2027-03-31T23:00:00Z`

Stated zone, date only. The source says "Closes 31 October 2026 (United Kingdom)."

- `form` = `date_only`
- `stated_timezone` = `Europe/London`
- `resolved_timezone` = `Europe/London`
- `local_time` = `23:59:59`
- `fixed_at` = `2026-10-31T23:59:59Z`
- On this date Britain is on GMT (UTC+0). The same calendar date with no zone would have been `2026-10-31T22:59:59Z` in Africa/Lagos. Those instants are not interchangeable.

Explicit clock time. A source that says 15:00 in Paris on 1 June 2027, which is Central European Summer Time (UTC+2) in tzdata 2026e:

- `form` = `instant`
- `stated_timezone` = `Europe/Paris`
- `resolved_timezone` = `Europe/Paris`
- `local_time` = `15:00:00`
- `boundary` = `instant`
- `display_date` = `2027-06-01`
- `fixed_at` = `2027-06-01T13:00:00Z`

This last row is an oracle in the script output. It is not one of the five full samples.

`timestamps.updated_at` more than 24 hours after `evaluation_time` is `timestamp_in_future` on `timestamps.updated_at`. That check uses the supplied instant, not the clock. 24 hours after `2026-11-08T12:00:00Z` is `2026-11-09T12:00:00Z`.

## 8. Listing object

**Proposed.** A listing is one JSON object. Encodings are UTF-8. Duplicate JSON keys MUST be rejected (`invalid_json` on `$`). Integers are JSON numbers with no fraction, in the safe range `-(2^53-1) .. 2^53-1`. Booleans are `true` or `false`, not `0` or `1`. Strings MUST NOT have leading or trailing whitespace, MUST NOT contain ASCII controls (`U+0000`–`U+001F`), and MUST NOT contain `<` or `>`. This version does not rewrite strings. Bad input is an error, not a cleaned value.

There are no optional keys in version 1.0.0. A nullable value is present as JSON `null`. An absent required key is `missing_required_field`. A present `null` where null is forbidden is `invalid_type`.

`synthetic` MUST be `true` on every sample in this document and on any fixture. Production rows that real students could see MUST use `false`. The record validator accepts both. PathSync student surfaces MUST drop `synthetic: true`.

## 9. Field tables

Constraints that need more than a cell are in sections 10–16. "Required" means the key MUST be present. "Null" means JSON `null` is allowed.

### 9.1 Top level

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `schema_version` | string | yes | no | Exactly `1.0.0` |
| `listing_id` | string | yes | no | `^lst_[0-9A-HJKMNP-TV-Z]{26}$` (Crockford base32, no I, L, O, U) |
| `kind` | string | yes | no | `scholarship`, `internship`, `job` |
| `synthetic` | boolean | yes | no | `true` fixture, `false` production |
| `revision` | integer | yes | no | `1` .. `1000000` |
| `title` | string | yes | no | 1..180. Not a placeholder (section 12) |
| `summary` | string | yes | no | 1..400, or exactly `[withdrawn]` on a tombstone |
| `description` | string | yes | no | 1..8000, or exactly `[withdrawn]` on a tombstone |
| `provider` | object | yes | no | Section 9.2 |
| `source` | object | yes | no | Section 9.3 |
| `application` | object | yes | no | Section 9.4 |
| `eligibility` | object | yes | no | Section 9.5 |
| `deadline` | object | yes | no | Section 10 |
| `award` | object | yes | no | Section 9.6 |
| `location` | object | yes | no | Section 9.7 |
| `employment` | object | yes | yes | Null if and only if `kind` is `scholarship`. Section 9.8 |
| `documents_required` | array of string | yes | no | 0..20 items, each 1..160, unique, sorted by UTF-8 bytes. Empty means not stated |
| `how_to_apply` | string | yes | no | 1..4000, or exactly `[withdrawn]`, or exactly `Not stated by the source.` |
| `lifecycle` | object | yes | no | Section 14 |
| `verification` | object | yes | no | Section 13 |
| `timestamps` | object | yes | no | Section 9.9 |
| `dedupe_key` | string | yes | no | 64 lowercase hex. Section 16 |
| `content_hash` | string | yes | no | 64 lowercase hex. Section 16 |
| `supersedes` | string | yes | yes | Null, or a `listing_id` other than this row's id |

### 9.2 `provider`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `name` | string | yes | no | 1..160. Not a placeholder |
| `type` | string | yes | no | `government`, `tertiary_institution`, `company`, `foundation`, `ngo`, `multilateral`, `unknown` |
| `country` | string | yes | no | ISO 3166-1 alpha-2, or `ZZ` when the source does not say |
| `url` | string | yes | yes | Canonical `https` URL, or null |

`provider.country` `ZZ` is allowed. It MUST NOT be used as proof that Nigerian students are eligible.

### 9.3 `source`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `name` | string | yes | no | 1..80, `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `kind` | string | yes | no | `official`, `aggregator`, `news`, `manual`, `unknown` |
| `url` | string | yes | no | Canonical `https` URL of the page the facts were taken from |
| `retrieved_at` | string | yes | no | UTC timestamp. Not after `timestamps.updated_at` |

`source.kind` is the producer's classification of that page. `news` is allowed and MUST NOT be labelled `official`. `unknown` is allowed and PathSync MUST NOT render it as the funder's own site.

### 9.4 `application`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `url` | string | yes | no | Canonical `https` URL. Immutable for a `listing_id` |
| `url_kind` | string | yes | no | `direct_application`, `official_programme_page`, `aggregator_page`, `unknown` |
| `contact_email` | string | yes | yes | Null, or one address, syntax only, length 1..120 |

**Proposed.** `application.url` does not change for a given `listing_id`. A replacement URL is a new `listing_id` whose `supersedes` names the previous id. The previous row is withdrawn with `closed_reason` `superseded` or `removed_by_producer`.

PathSync MUST use an "Apply" label only when `url_kind` is `direct_application` or `official_programme_page`. For `aggregator_page` and `unknown` the label is "Source page".

`contact_email` MAY be null. When set, it MUST match `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` and MUST be a role mailbox from the source, not a student's address. Free-text fields MUST NOT contain an email address. The record validator checks the pattern. It cannot know whether the mailbox is a role.

### 9.5 `eligibility`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `citizenship` | object | yes | no | `requirement` plus `countries`. This is not the student's nationality |
| `education_levels` | array of string | yes | no | 1..6. Tokens below. `any`, `unknown`, and `not_applicable` must be the sole item |
| `audience_tags` | array of string | yes | no | 0..6, unique, sorted |
| `fields_of_study` | array of string | yes | no | 1..20. `any` and `unknown` must be the sole item |
| `year_of_study` | array of string | yes | no | 1..8. `any`, `unknown`, and `not_applicable` must be the sole item |
| `min_cgpa` | object | yes | no | Below |
| `institutions` | object | yes | no | Below |
| `demographic_focus` | array of string | yes | no | 0..7, unique, sorted. Empty means not stated |
| `criteria_stated` | boolean | yes | no | `false` requires a fixed sentence, except tombstones |
| `criteria_text` | string | yes | no | 1..4000 |

`citizenship` fields:

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `requirement` | string | yes | no | `explicit`, `unconstrained`, `unknown` |
| `countries` | array of string | yes | no | See the pairs below. Unique, sorted by UTF-8 |

Pairs, all stage 2, no clock:

- `explicit`: `countries` is 1..20 ISO 3166-1 alpha-2 codes. `*` is forbidden. This is an explicit citizenship requirement.
- `unconstrained`: `countries` is exactly `["*"]`. The source says nationality is not a limit.
- `unknown`: `countries` is exactly `[]`. The source does not say. This is unknown metadata, not a ban and not an open invitation written as fact.
- Any other pair is `invalid_constraint` on `eligibility.citizenship.requirement`.

`education_levels` tokens: `secondary`, `undergraduate`, `postgraduate`, `any`, `unknown`, `not_applicable`.

`audience_tags` tokens: `nigerian_university_student`, `nigerian_postgraduate`, `nigerian_secondary`, `african_student`, `open_international`.

`fields_of_study` tokens: `any`, `unknown`, `agriculture`, `architecture`, `arts`, `business`, `computer_science`, `education`, `engineering`, `health`, `humanities`, `law`, `mathematics`, `medicine`, `natural_sciences`, `social_sciences`, `other`.

`year_of_study` tokens: `100`, `200`, `300`, `400`, `500`, `postgraduate`, `any`, `unknown`, `not_applicable`. These correspond to the current onboard levels `100L`–`500L` and `Postgraduate`.

`min_cgpa`:

| Field | Type | Null | Constraints |
| --- | --- | --- | --- |
| `scale` | string | no | `4.0`, `5.0`, `none`, `unknown` |
| `minimum_hundredths` | integer | yes | Null when scale is `none` or `unknown`. For `5.0`, integer 1..500. For `4.0`, integer 1..400. 350 means 3.50 |
| `class_equivalent` | string | yes | Null, or `first_class`, `second_class_upper`, `second_class_lower`, `third_class`, `pass`. Must be null when scale is `unknown` |

Hundredths avoid binary floats. The current `NUMERIC(3,2)` column is a storage detail of PathSync, not the exchange type.

`institutions`:

| Field | Type | Null | Constraints |
| --- | --- | --- | --- |
| `scope` | string | no | `any_accredited_nigerian_tertiary`, `named`, `not_restricted`, `unknown`, `not_applicable` |
| `names` | array of string | no | Empty unless `scope` is `named`. Then 1..30 strings, each 1..160, unique, sorted |

When `criteria_stated` is `false` and the row is not withdrawn, `criteria_text` MUST be exactly `Not stated by the source.` When `criteria_stated` is `true`, `criteria_text` MUST NOT be that sentence and MUST NOT be `[withdrawn]`. Withdrawn rows are specified in section 15.

### 9.6 `award`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `kind` | string | yes | no | `cash`, `full_tuition`, `stipend`, `unpaid`, `mixed`, `not_stated` |
| `summary` | string | yes | yes | 1..200, or null |
| `currency` | string | yes | yes | `NGN`, `USD`, `GBP`, `EUR`, `OTHER`, or null |
| `amount_minor` | integer | yes | yes | Null, or `0` .. `2^53-1` minor units (kobo, cents) |
| `period` | string | yes | yes | `one_off`, `per_year`, `per_month`, `full_programme`, or null |

**Proposed.** `not_stated` requires `summary`, `currency`, `amount_minor`, and `period` all null. The producer MUST NOT write `0` to mean "not stated".

`unpaid` requires a summary, null `currency`, and null `amount_minor`. `period` may be null or one of the period tokens.

`cash`, `stipend`, `full_tuition`, and `mixed` require a summary. `amount_minor` may be null when the source gives no single figure. When `amount_minor` is set, `currency` MUST be `NGN`, `USD`, `GBP`, or `EUR` (not `OTHER`) and `period` MUST be set. `OTHER` requires `amount_minor` null.

`employment.paid` `true` forbids `award.kind` `unpaid` and `not_stated`. `employment.paid` `false` requires `award.kind` `unpaid`. `paid` null leaves the award free, including `not_stated`.

### 9.7 `location`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `country` | string | yes | no | ISO alpha-2 or `ZZ` |
| `locality` | string | yes | yes | Null, or 1..120 (a city or campus, not a country name repeated) |
| `arrangement` | string | yes | no | `on_site`, `remote`, `hybrid`, `unknown` |

### 9.8 `employment`

The key is always present. The value is null for `scholarship`. For `internship` and `job` it is an object:

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `employment_type` | string | yes | no | Internship: exactly `internship`. Job: `full_time`, `part_time`, `contract`, `temporary`, `unspecified`. A job MUST NOT use `internship` |
| `duration_text` | string | yes | yes | Null or 1..120 |
| `paid` | boolean | yes | yes | Null means the source did not say |

### 9.9 `timestamps`

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `created_at` | string | yes | no | UTC timestamp |
| `updated_at` | string | yes | no | `>= created_at` |
| `published_at` | string | yes | yes | Null only while `publication_status` is `draft` |
| `expired_at` | string | yes | yes | Non-null if and only if `lifecycle.status` is `expired` |
| `closed_at` | string | yes | yes | Non-null if and only if `lifecycle.status` is `closed` and `publication_status` is `published` |
| `withdrawn_at` | string | yes | yes | Non-null if and only if `publication_status` is `withdrawn`. Then it equals `updated_at` |

When set, `published_at`, `expired_at`, and `closed_at` are `>= created_at` and `<= updated_at`. `expired_at` on an expired fixed deadline MUST be greater than `deadline.fixed_at` (the listing is still open at `fixed_at`).

## 10. Deadline rules

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `kind` | string | yes | no | `fixed`, `rolling`, `unknown` |
| `form` | string | yes | yes | `date_only` or `instant` when `kind` is `fixed`, otherwise null |
| `stated_timezone` | string | yes | yes | Canonical IANA name when the source names a zone, otherwise null |
| `resolved_timezone` | string | yes | yes | The IANA name used to compute `fixed_at`. Null when `kind` is not `fixed` |
| `display_date` | string | yes | yes | `YYYY-MM-DD` when `kind` is `fixed`, otherwise null |
| `local_time` | string | yes | yes | `HH:MM:SS` in `resolved_timezone` when `kind` is `fixed`, otherwise null |
| `boundary` | string | yes | yes | `inclusive_end_of_local_day` or `instant` when `kind` is `fixed`, otherwise null |
| `fixed_at` | string | yes | yes | UTC timestamp of `display_date` plus `local_time` in `resolved_timezone` when `kind` is `fixed`, otherwise null |
| `raw_text` | string | yes | yes | Source words. Required for `fixed` and `rolling`. Null for `unknown` |

**Settled instruction.**

- `date_only` sets `local_time` to `23:59:59` and `boundary` to `inclusive_end_of_local_day`. End of day is 23:59:59 in `resolved_timezone`, not a fixed UTC offset chosen in advance.
- If the source names a zone, `stated_timezone` and `resolved_timezone` are that zone's canonical IANA name (`ZoneInfo(name).key == name`).
- If the source does not name a zone, `stated_timezone` is null and `resolved_timezone` is `Africa/Lagos`. That is the only use of West Africa Time as a default.
- `instant` means the source gave a clock time. `boundary` is `instant` and `local_time` is that clock time, not forced to `23:59:59`. A stated zone is stored when the source gave one. If an explicit clock time has no zone, `stated_timezone` is null and `resolved_timezone` is `Africa/Lagos`, and the clock time is kept. It is not rewritten to end of day.
- `fixed_at` is that local civil time converted with the IANA data. The conversion attaches the zone with `fold=0` (the earlier occurrence when a clock time happens twice). If the local time does not exist because clocks sprang forward, the record is `invalid_constraint` on `deadline.local_time`. Do not move it to the next valid minute.
- `display_date` is the civil date in `resolved_timezone`, which is the date the source stated for a date-only deadline.
- `raw_text` is 1..300 characters copied from the source for `fixed` and `rolling`.
- `rolling` sets `form`, `stated_timezone`, `resolved_timezone`, `display_date`, `local_time`, `boundary`, and `fixed_at` to null.
- `unknown` sets those fields and `raw_text` to null.
- Forbidden stand-ins, when they are the whole of `raw_text` or are written into a date field: `Not specified`, `Not available`, `Varies`, `TBC`, `TBA`, `null`, `2099-12-31`, `1970-01-01`, `9999-12-31`. The current scraper maps several of these to SQL null. This schema does not.

A fixed deadline is expired at `evaluation_time` when `evaluation_time` > `fixed_at`. Equality is still open. Rolling and unknown are never expired. The expiry test reads `fixed_at`. It does not apply a second timezone conversion.

## 11. Eligibility and the PathSync consumer filter

### 11.1 Producer duties

**Proposed.** The producer MUST set citizenship and education from the source text, not from the scraper host and not from a model guess. Hardcoded `Various`, `International`, and `various` in the current scholarship payload are not acceptable values for `provider.name`, a country, or an education level.

`audience_tags` MUST include `nigerian_university_student` only when the source covers Nigerian university students (undergraduates, or undergraduates and postgraduates together). `nigerian_postgraduate` is for postgraduate-only calls. `open_international` and `african_student` describe audience. They are not a citizenship requirement. A headline that says "international" or "Africa" does not set `citizenship.requirement` to `explicit` and does not put `NG` in `countries`. The producer sets `explicit` only from an actual nationality list, `unconstrained` only when the source says there is no nationality limit, and `unknown` when the source does not say.

### 11.2 Student-surface filter

**Proposed.** This function is PathSync's. It is not the NaijaOpportunities record validator. The first validator card does not implement it.

`pathsync_student_surface(listing, student, evaluation_time) -> include | exclude(reason)`

`student` is the signed-in profile, not a listing. Fields the consumer may use: `nationality` (to be collected at onboarding; not collected today), `level`, CGPA and its scale, `course`, and demographic selections. `goal` is not an exclude rule. Free-text leadership, projects, and about are for the later letter and CV. They MUST NOT be copied onto the listing.

Citizenship rule 4 is a settled instruction. Education rules 5 and 6 are the proposals in section 5.

Exclude reasons, first match wins:

| Order | Condition | `reason` |
| --- | --- | --- |
| 1 | `synthetic` is true | `synthetic` |
| 2 | `validate_active_feed` returns any error | `not_active` |
| 3 | `kind` is not `scholarship`, `internship`, or `job` | `kind` |
| 4 | `citizenship.requirement` is `explicit`, `student.nationality` is present, and it is not in `citizenship.countries` | `citizenship_mismatch` |
| 5 | `education_levels` is `["secondary"]` | `education` |
| 6 | `kind` is `scholarship` or `internship` and `education_levels` is `["unknown"]` | `education` |
| 7 | `education_levels` is exactly `["postgraduate"]` and `student.level` is present and is not `Postgraduate` | `education` |
| 8 | `year_of_study` is a specific list and `student.level` maps to a token outside that list | `year` |
| 9 | `fields_of_study` contains neither `any` nor `unknown`, the course maps to a token other than `other`, and that token is absent | `field` |
| 10 | Both CGPA sides are known and the converted student hundredths are below `minimum_hundredths` | `cgpa` |
| 11 | Otherwise | include |

`unconstrained`, `unknown` citizenship, `not_applicable` education, and a job with unknown education do not match rows 4 or 6. A missing `student.nationality` skips row 4. Missing student level, course, or CGPA skips rules 7, 8, 9, or 10 respectively. Skipping does not include a listing that failed an earlier rule.

Level map: `100L`→`100`, `200L`→`200`, `300L`→`300`, `400L`→`400`, `500L`→`500`, `Postgraduate`→`postgraduate`.

Course map from the current `COURSES` list in `frontend/src/pages/Onboard.jsx`. This map is part of the proposal:

| Onboard string | Token |
| --- | --- |
| Computer Science | `computer_science` |
| Systems Engineering | `engineering` |
| Engineering (Electrical) | `engineering` |
| Engineering (Mechanical) | `engineering` |
| Engineering (Civil) | `engineering` |
| Engineering (Chemical) | `engineering` |
| Engineering (Petroleum) | `engineering` |
| Medicine & Surgery | `medicine` |
| Pharmacy | `health` |
| Nursing | `health` |
| Law | `law` |
| Economics | `business` |
| Accounting | `business` |
| Business Administration | `business` |
| Mass Communication | `humanities` |
| Political Science | `social_sciences` |
| Sociology | `social_sciences` |
| Psychology | `social_sciences` |
| Education | `education` |
| Agriculture | `agriculture` |
| fishery | `agriculture` |
| Architecture | `architecture` |
| Mathematics | `mathematics` |
| Physics | `natural_sciences` |
| Chemistry | `natural_sciences` |
| Biology | `natural_sciences` |
| Biochemistry | `natural_sciences` |
| Microbiology | `natural_sciences` |
| Other | no field exclude |

The string `fishery` is the current UI value. Mapping it to `agriculture` is a proposal about that control, not a claim about university faculties.

CGPA conversion uses integer hundredths. Scales are 400 or 500. To express student hundredths `h` on scale `ss` as listing scale `ls`:

`converted = (h * ls + ss // 2) // ss`

Worked example: 3.20 on a 4.0 scale is `h=320`, `ss=400`, listing scale 5.0 is `ls=500`. `converted = (160000 + 200) // 400 = 400`, which is 4.00 on a 5.0 scale. Exclude only when `converted < minimum_hundredths`. A class equivalent without `minimum_hundredths` does not exclude.

Demographic map, stored for display and ranking later, not for rule 1–11: `Female student`→`female`, `Student with disability`→`disability`, `First-generation student`→`first_generation`, `From a low-income family`→`low_income`, `From Northern Nigeria`→`northern_nigeria`, `From Niger Delta region`→`niger_delta`, `From rural area`→`rural`. `None of these` writes no tag.

Deadline-tracker labels for an included listing:

- `fixed`: show `display_date` and `resolved_timezone`. Day count is that zone's calendar date of `evaluation_time` subtracted from `display_date`. `0` means "closes today". No negative numbers, because an expired listing is not included.
- `rolling`: the words `Rolling admission`. No day count and no invented end date.
- `unknown`: the words `Deadline not stated`. No day count and no invented end date.

If `synthetic` were ignored, at `CONTRACT_EVALUATION_TIME` the open scholarship, the rolling internship, and the job would all be included. The job's unknown citizenship does not withhold it, and its kind does not withhold it. The historical scholarship and the tombstone exclude as `not_active`. With `synthetic: true`, which is how they are written, all five exclude as `synthetic`. They are fixtures, not a live feed.

## 12. Source provenance and URLs

**Proposed.** `source.url` is the page that was read. `application.url` is the best next page for the student. They MAY differ. They MUST both be canonical `https` URLs. The validator does not resolve DNS and does not fetch them. Trust is a recorded classification (`source.kind`, `application.url_kind`) plus deterministic syntax checks.

A URL is canonical when all of the following hold:

1. No leading or trailing whitespace and no ASCII whitespace inside.
2. Scheme `https`, no userinfo, no fragment, no port.
3. Host is lowercase dot-separated LDH labels, not an IPv4 or IPv6 literal, not `localhost`, not ending in `.localhost`, and not exactly `example.com`, `example.org`, or `example.net`.
4. Hosts ending in `.example` are syntactically allowed so these fixtures have a legal URL. Production rows MUST use the real fetched host. `.example` is not a placeholder bypass for `example.com`.
5. Path is empty or matches `^(/[A-Za-z0-9._~-]+)*$`. Empty path is serialised with no slash (`https://rivertrust.example`, not `https://rivertrust.example/`). No trailing slash, no `.` or `..` segments.
6. Query, if present, is `?` plus `key=value` pairs sorted by key then value, keys lowercase, percent-encoding in uppercase hex. These query names are forbidden and MUST be stripped by the producer before publish: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`, `igshid`, `ref`.

A non-canonical URL is `non_canonical_url` on that field (`source.url`, `application.url`, or `provider.url`). The validator MUST NOT rewrite it.

Placeholder `provider.name` and `title`, compared after trimming and ASCII lowercasing, are `placeholder_name` on that field. Names: `various`, `see listing`, `see the listing`, `n/a`, `na`, `tbc`, `tba`, `unknown`, `test`, `none`, `null`, `not specified`, `not available`, `provider`, `company`, `remote`. Title-only additions to that test: `untitled`, `scholarship`, `job`, `internship`. The current scraper values `Various`, `See listing`, and `Remote` fail this rule on purpose.

`provider.type` `unknown` and `source.kind` `unknown` are honest values. They are not placeholders.

## 13. Verification and freshness

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `state` | string | yes | no | `unverified`, `machine_checked`, `human_verified` |
| `last_checked_at` | string | yes | no | UTC timestamp, `>= created_at` and `<= updated_at` |
| `fresh_until` | string | yes | no | UTC timestamp after `last_checked_at`, per the state |
| `method` | string | yes | no | `page_fetch`, `manual_review`, `unchanged_hash` |

**Proposed.**

- `machine_checked` and `unverified`: `fresh_until` is exactly 168 hours after `last_checked_at`. Method is `page_fetch` or, for `machine_checked` only, `unchanged_hash` when the new fetch's relevant text hashed equal to the previous one. `unchanged_hash` is not the listing `content_hash`. It is the producer's page-text hash, and that hash is not a field in 1.0.0.
- `human_verified`: method is `manual_review`. `fresh_until` is after `last_checked_at` and at most 2160 hours after it.
- `unverified` means a fetch happened and the facts were not confirmed. PathSync still requires the structural fields. Student surfaces require `validate_active_feed` to pass, which an unverified-but-fresh open listing can. The UI MUST show the state. This proposal does not hide `unverified` solely for being unverified, because a 7-day clock already removes unreviewed rows. That choice is inside check 3.
- Active feed, and only when `publication_status` is `published` and `status` is `open`: if `evaluation_time` > `fresh_until`, error `stale_listing` on `verification.fresh_until`.
- Historical validation does not reject stale rows. The historical sample is stale at `CONTRACT_EVALUATION_TIME` (`fresh_until` `2026-11-07T23:00:00Z`) and is still a valid historical record.

## 14. Lifecycle, active feed, and historical retention

| Field | Type | Required | Null | Constraints |
| --- | --- | --- | --- | --- |
| `publication_status` | string | yes | no | `draft`, `published`, `withdrawn` |
| `status` | string | yes | no | `open`, `closed`, `expired` |
| `closed_reason` | string | yes | yes | Null, or `deadline_passed`, `provider_closed`, `duplicate`, `untrusted`, `removed_by_producer`, `superseded` |

**Proposed stage-2 combinations, before any evaluation instant:**

| `publication_status` | `status` | `closed_reason` | Timestamp rules |
| --- | --- | --- | --- |
| `draft` | `open` | null | `published_at`, `expired_at`, `closed_at`, `withdrawn_at` all null |
| `published` | `open` | null | `published_at` set. `expired_at`, `closed_at`, `withdrawn_at` null |
| `published` | `expired` | `deadline_passed` | `expired_at` set and `> deadline.fixed_at`. `deadline.kind` is `fixed`. `closed_at` and `withdrawn_at` null |
| `published` | `closed` | `provider_closed`, `duplicate`, or `untrusted` | `closed_at` set. `expired_at` and `withdrawn_at` null |
| `withdrawn` | `closed` | `removed_by_producer` or `superseded` | Tombstone rules in section 15 |

Any other combination is `invalid_constraint` on `lifecycle.status`.

### Active feed versus historical record

Two functions share stages 1 and 2 (section 18) and then apply a different stage 3.

`validate_active_feed(listing, evaluation_time)` is what an active student feed must pass:

- If `publication_status` is not `published` or `status` is not `open`: one error, `not_on_active_feed` on `lifecycle.status`. Do not also emit `expired_deadline`.
- If it is published and open, and `deadline.kind` is `fixed`, and `evaluation_time` > `fixed_at`: `expired_deadline` on `deadline.fixed_at`.
- If it is published and open and `evaluation_time` > `fresh_until`: `stale_listing` on `verification.fresh_until`.
- Rolling and unknown do not produce `expired_deadline`.

`validate_historical(listing, evaluation_time)` is what a retained row must pass:

- A published open listing whose fixed deadline is already past is still an error: `expired_deadline` on `deadline.fixed_at`. History is not a way to store a contradiction. The producer marks it `expired` and then it can be retained.
- If `status` is `expired` and `evaluation_time` <= `fixed_at`: `status_deadline_mismatch` on `lifecycle.status` (it was marked expired too early).
- Draft, withdrawn, closed, expired-and-actually-past, and open-and-not-yet-past rows are retainable. Staleness does not reject them.

The invalid sample `invalid-expired-open` is the active-feed failure. The valid sample `valid-historical-expired` is the same kind of past deadline after the producer has marked it expired. Both keep the original `fixed_at`. Neither moves the date.

## 15. Identity, deduplication, update, and deletion

**Proposed.**

- `listing_id` is assigned by the producer, once, and never reused, including after withdrawal.
- PathSync may keep a local UUID. That UUID is not `listing_id`. The current `gen_random_uuid()` default is a local surrogate, not this id.
- `dedupe_key` is `SHA-256` hex of the UTF-8 bytes of `kind + "\n" + application.url`. Section 16.
- `application.url` is immutable, so `dedupe_key` is immutable for that id.
- At most one row that is not `withdrawn` may share a `dedupe_key`. A second id is `duplicate_listing` on `dedupe_key`. The store returns the existing `listing_id`. This is a store rule. The single-record validator only checks that the key matches the kind and URL.
- An update is the same `listing_id`. `revision` becomes `stored + 1` with no gaps. `updated_at` is greater than the stored `updated_at`. `content_hash` changes. The same revision and the same hash is an idempotent replay. The same revision and a different hash is `revision_conflict` on `revision`. A revision greater than `stored + 1`, or lower than stored, is the same code.
- The single-record validator checks `revision >= 1`. It does not know the stored revision. Gap checks belong to the store, which is not the first card.
- Deletion from the active feed is a new revision with `publication_status` `withdrawn`, `status` `closed`, and `closed_reason` `removed_by_producer` or `superseded`. There is no physical delete in the contract. The id remains so PathSync does not treat a reappearance as a new opportunity under a new id.
- For 730 days after `withdrawn_at` (730 × 24 hours) the producer MUST NOT mint a new `listing_id` for that `dedupe_key`. After that, a new id MAY exist and SHOULD set `supersedes` to the withdrawn id when it is the same programme. 730 days is a proposal, measured in exact hours so it does not depend on calendar months.
- Tombstone text, so personal data and stale instructions are not kept in the prose fields: `summary`, `description`, `how_to_apply`, and `eligibility.criteria_text` are exactly `[withdrawn]`. `criteria_stated` is `false`. `documents_required` is `[]`. `award.kind` is `not_stated` and the other award fields are null. `application.contact_email` is null. `title`, `provider`, `deadline`, `eligibility` structure, ids, and URLs stay. `title` MUST NOT be `[withdrawn]`.
- PathSync removes a withdrawn id from student surfaces on the next sync and keeps the tombstone so the id is known.

The record validator does not check the 730-day reservation or the previous revision. Those need the store. The tombstone sample must pass `validate_record` and `validate_historical`, and it must fail `validate_active_feed` with `not_on_active_feed` on `lifecycle.status`.

## 16. Canonical JSON, dedupe key, and content hash

**Settled instruction for the digest algorithm.** The runnable copy is `docs/listings/compute_listing_hashes.py`. It uses the Python standard library only (`hashlib`, `json`, `unicodedata`, `zoneinfo`, `urllib.parse`).

From the repository root:

```text
python3 docs/listings/compute_listing_hashes.py
```

Inputs are the five synthetic fixtures:

- `docs/listings/fixtures/valid-scholarship.json`
- `docs/listings/fixtures/valid-internship.json`
- `docs/listings/fixtures/valid-job.json`
- `docs/listings/fixtures/valid-historical-expired.json`
- `docs/listings/fixtures/valid-tombstone.json`

The same five objects are embedded in section 21. The script refuses to pass if a fixture and the embedded object differ. The measured run is also stored at `docs/listings/hash-output.txt`. These files are documentation. They are not a product validator.

Algorithm, which the script performs and then checks:

1. Parse the JSON object. Duplicate keys are invalid. Pretty printing does not matter.
2. Apply Unicode NFC to every string. The hash is of those strings, encoded as UTF-8. Non-ASCII characters are not forced into `\u` escapes. `/` is not escaped.
3. Designated arrays must already be unique and sorted by UTF-8 bytes: `citizenship.countries`, `education_levels`, `audience_tags`, `fields_of_study`, `year_of_study`, `demographic_focus`, `institutions.names`, and `documents_required`. The hash does not silently reorder them. A different order is a different hash.
4. `application.url`, `source.url`, and a non-null `provider.url` must already be canonical: lowercase host, no userinfo, no port, no fragment, no tracking query (`utm_*`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`, `igshid`, `ref`), remaining query sorted by key then value, no trailing slash unless the path is empty. Identity: `listing_id` matches `^lst_[0-9A-HJKMNP-TV-Z]{26}$`.
5. JSON null is kept. An absent key is not the same value and is not invented before hashing.
6. `dedupe_key` is SHA-256, lowercase hex, of the UTF-8 bytes of `kind`, one newline (`U+000A`), and the canonical `application.url`. The stored field must already equal that digest.
7. `content_hash` is SHA-256, lowercase hex, of the UTF-8 JSON Canonicalization Scheme (RFC 8785) encoding of the object with `content_hash` removed and every other field kept, including `dedupe_key` and JSON null. This version has no fractional numbers, so sorted keys and no insignificant whitespace match JCS for these values.
8. A fixed `fixed_at` must equal the `zoneinfo` conversion of `display_date` and `local_time` in `resolved_timezone`, using `fold=0`. The script measures that. It does not accept a hand-typed offset.
9. Among the five fixtures, `listing_id` values must differ and `dedupe_key` values must differ. A later store treats the same `dedupe_key` on another id as `duplicate_listing`. The same `listing_id` and `revision` with a different `content_hash` is `revision_conflict`.

Stage 2 of a future validator recomputes both digests. Error codes: `hash_mismatch` on `content_hash`, `dedupe_mismatch` on `dedupe_key`. Stage 1 does not compute them. The missing-field and bad-type samples set `content_hash` to 64 zeroes on purpose. Implementations that stop after stage 1 MUST NOT report a hash error for them.

Measured output of the command above, tzdata `2026e`, Python 3.12.3. This block is the script's stdout, not a hand-written hash:

```text
synthetic: true
not_production_data: true
command: python3 docs/listings/compute_listing_hashes.py
python: 3.12.3
tzdata: version 2026e
hash_excludes: content_hash
hash_includes: dedupe_key and every other stored field, including JSON null
collision_rule: same dedupe_key with a different listing_id is duplicate_listing
version_rule: same listing_id and revision with a different content_hash is revision_conflict
self_check_null_vs_absent: null=d091f9c83c091f79652fe8786375b3fe4ce0861a56f5bfbafedbe431877ff0e8 absent=44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a
self_check_unicode_nfc: composed=86028b41ba792eaf82aa26a45b218f6734f7f1096a86f1746c8296e088a0ccb4
self_check_array_order: GH before NG differs from NG before GH
self_check_url: https://apply.river.example/Path?a=1&b=2
self_check_identity: crockford listing_id accepted; I rejected
fixture: docs/listings/fixtures/valid-scholarship.json
listing_id: lst_01ARZ3NDEKTSV4RRFFQ69G5FAV
kind: scholarship
revision: 1
dedupe_key: fe013cbe8335afaf831e075cc8a6ddd673dcd385033639950850e0038ddf9609
content_hash: eea1f8f31f86b2fb2a726acf4d2c2ac0aa01e7146f546166bb1fb8182c96d885
deadline_fixed_at: 2027-03-31T22:59:59Z
assert: match
fixture: docs/listings/fixtures/valid-internship.json
listing_id: lst_01ARZ3NDEKTSV4RRFFQ69G5FAW
kind: internship
revision: 1
dedupe_key: b1d7db3f769b7fc8a52a021d37bd8c8e77cb5834ca6795e897621e4bdfbfc984
content_hash: bbe4c50ecfd12ed5e149e6a2134b78d7a59d9918ae2f0deda8e2471f40449897
deadline_fixed_at: n/a
assert: match
fixture: docs/listings/fixtures/valid-job.json
listing_id: lst_01ARZ3NDEKTSV4RRFFQ69G5FAX
kind: job
revision: 1
dedupe_key: 007941f690b5ef4c9033f276aea54c382cf51d6de414538a1c84686021b1a1bb
content_hash: 025d2d7838f523f28081662830bf2402a4583daab73ead9869cf37a3d1eba2aa
deadline_fixed_at: n/a
assert: match
fixture: docs/listings/fixtures/valid-historical-expired.json
listing_id: lst_01ARZ3NDEKTSV4RRFFQ69G5FAY
kind: scholarship
revision: 2
dedupe_key: 40c390e2260ade57b9af50863b4d13e1b9edc72123a261f9c880eb62c4385a5a
content_hash: b7d35504f741c15389b79ee5f1c5e1cdb59fb8bb4fd17ec9ddf4aded25b3318c
deadline_fixed_at: 2026-10-31T23:59:59Z
assert: match
fixture: docs/listings/fixtures/valid-tombstone.json
listing_id: lst_01ARZ3NDEKTSV4RRFFQ69G5FB3
kind: scholarship
revision: 2
dedupe_key: 2c4c09be0f200675e536c3df4c200b58a6473a71a2a226b3452f01d40563610c
content_hash: acd61b770a33343b35b7749da420a167a306f9ec736d4576fc975b747522ab12
deadline_fixed_at: 2027-03-31T22:59:59Z
assert: match
oracle: date_only_no_zone stated=none resolved=Africa/Lagos local=2027-03-31T23:59:59 fixed_at=2027-03-31T22:59:59Z
oracle: date_only_europe_london stated=Europe/London resolved=Europe/London local=2026-10-31T23:59:59 fixed_at=2026-10-31T23:59:59Z
oracle: date_only_wat_default_check stated=none resolved=Africa/Lagos local=2026-01-15T23:59:59 fixed_at=2026-01-15T22:59:59Z
oracle: instant_europe_paris stated=Europe/Paris resolved=Europe/Paris local=2027-06-01T15:00:00 fixed_at=2027-06-01T13:00:00Z
fixtures_checked: 5
result: ok
```

## 17. Privacy and sanitisation

**Fact.** The README says student input passes a regex layer and a spaCy NER layer before any LLM, and that only academic facts reach the model. `backend/app/middleware/privacy.py` redacts Nigerian phone numbers, NIN-shaped and BVN-shaped 11-digit runs, emails, street-like addresses, and spaCy `PERSON`, `GPE`, `LOC`, `FAC`, and `ORG` entities outside a short allow-list. That middleware is for student text. It is the wrong tool for listings: redacting `ORG` and `GPE` would destroy providers and places.

**Proposed.**

- A listing MUST NOT contain a student's name, NIN, BVN, phone, home address, bank account, transcript, or PathSync profile. Chat text, `student_profiles`, and onboard free text stay in PathSync.
- The record validator rejects, with `forbidden_personal_data` on the field, any free-text field that matches `\b\d{11}\b` (NIN/BVN-shaped), `\b(?:\+?234|0)[789]\d{9}\b` (Nigerian phone), or an email address. Free-text fields are `title`, `summary`, `description`, `how_to_apply`, `criteria_text`, `deadline.raw_text`, `provider.name`, `location.locality`, `award.summary`, `employment.duration_text`, `institutions.names[]`, and `documents_required[]`. `contact_email` is the only email field.
- HTML is rejected (`<` and `>`), not stripped, so two producers cannot sanitise differently.
- The validator does not call spaCy and does not call a model. Those calls are not deterministic.
- Image URLs are not a 1.0.0 field. The current `image_url` column is out of this contract. A later minor version may add one. It would still have to be a canonical `https` URL.
- PathSync MUST NOT send listing text through `redact_pii` before validation. Validation sees the producer strings. Letter generation continues to redact student input before a model call. That path is existing product behaviour, not redefined here.

## 18. Validator

**Proposed.** Three pure functions:

```text
validate_record(listing) -> list[Error]
validate_active_feed(listing, evaluation_time) -> list[Error]
validate_historical(listing, evaluation_time) -> list[Error]
```

```text
Error = {
  code: string,
  field: string,
  message: string,
  expected: string or absent,
  actual: string or absent,
  evaluation_time: string or absent
}
```

`message` MUST equal `code + ": " + field`. Example: `expired_deadline: deadline.fixed_at`. Tests assert `code`, `field`, and that the message contains the field path.

`field` is a dot path. Array indexes use `[0]`. The evaluation argument uses `$evaluation_time`. The whole document uses `$`.

No function reads the wall clock, the network, or a random source. Checking that `fixed_at` matches `resolved_timezone` reads the IANA timezone data, the same way section 16 does. No function rewrites the listing.

### Stage 1 — presence, types, unknown keys

Walk objects. The allowed keys are exactly the tables in sections 9, 10, 13, and 14. For each allowed key: missing → `missing_required_field`; present null where null is forbidden, or present with the wrong JSON type → `invalid_type` with `expected` and `actual`. Do not walk into a missing or wrongly typed parent. Unknown keys → `unknown_field`. Then stop if stage 1 produced any error. Sort by `(field, code)` using raw UTF-8 bytes.

The first card's missing-field sample omits `title`. The only stage-1 error is `missing_required_field` on `title`.

The first card's bad-type sample sets `revision` to the JSON string `"1"`. The only stage-1 error is `invalid_type` on `revision`, `expected` `integer`, `actual` `string`.

### Stage 2 — constraints that do not use `evaluation_time`

Apply sections 6 and 8–16, except the bullets that mention `evaluation_time`. Enums, patterns, lengths, sorts, uniqueness, citizenship consistency, deadline shape, lifecycle table, tombstone text, award consistency, employment-by-kind, canonical URLs, placeholder names, personal-data patterns, `dedupe_key`, and `content_hash`. Also `listing_id` alphabet and `supersedes` shape. Errors use `invalid_constraint`, `invalid_enum`, `placeholder_name`, `non_canonical_url`, `forbidden_personal_data`, `hash_mismatch`, or `dedupe_mismatch`, each with its field. Stop if any stage-2 error exists.

### Stage 3 — mode

Only if stages 1 and 2 are clean.

Shared preamble: if `evaluation_time` is not a valid UTC timestamp, return `invalid_constraint` on `$evaluation_time` and stop.

Active mode and historical mode then follow section 14. Also, in both modes, if `timestamps.updated_at` is more than 24 hours after `evaluation_time`, add `timestamp_in_future` on `timestamps.updated_at`.

Return stage-3 errors sorted by `(field, code)`.

### What the first card measures

After approval, the validator card in NaijaOpportunities is measured against this document at `CONTRACT_EVALUATION_TIME`:

| Fixture | Function | Result |
| --- | --- | --- |
| `valid-scholarship` | `validate_record`, `validate_active_feed`, `validate_historical` | no errors |
| `valid-internship` | all three | no errors |
| `valid-job` | all three | no errors. With `synthetic` false it stays in student matching. Unknown citizenship does not remove it |
| `valid-historical-expired` | `validate_record`, `validate_historical` | no errors |
| `valid-historical-expired` | `validate_active_feed` | `not_on_active_feed` on `lifecycle.status` |
| `valid-tombstone` | `validate_record`, `validate_historical` | no errors |
| `valid-tombstone` | `validate_active_feed` | `not_on_active_feed` on `lifecycle.status` |
| `invalid-missing-title` | `validate_record` | `missing_required_field` on `title` |
| `invalid-revision-type` | `validate_record` | `invalid_type` on `revision` |
| `invalid-expired-open` | `validate_record` | no errors |
| `invalid-expired-open` | `validate_active_feed` and `validate_historical` | `expired_deadline` on `deadline.fixed_at` |

"Valid samples pass" means the five valid fixtures pass `validate_record`. The expired-deadline failure is `validate_active_feed` on `invalid-expired-open`, whose message names `deadline.fixed_at`.

## 19. Proposed sync, pagination, and errors

**Uncertain / not an endpoint.** Neither repository contains a listings sync route. PathSync ingest is a local insert. NaijaOpportunities' checked-in routes at the observed commit are contact and image-proxy. The operation below is a logical contract for a later card. It assigns no scheme, host, or path. A later card that binds it to HTTPS must name the base URL in its own approved note. This document does not reserve `/api/v1/listings` or any other path, because inventing one would look like a live API.

**Proposed logical operation.**

```text
ListingsSync(
  feed,                "active" or "historical"
  schema_version,      "1.0.0"
  updated_after,       UTC timestamp or null
  limit,               integer 1..100, default 50
  cursor,              string or null
  evaluation_time      UTC timestamp
) -> page or error
```

`feed=active` returns only listings that pass `validate_active_feed` at `evaluation_time`, with `synthetic=false`. `feed=historical` returns listings that pass `validate_historical`, including expired and withdrawn rows, with `synthetic=false`.

Order is `timestamps.updated_at` ascending, then `listing_id` ascending. `updated_after` excludes rows whose `updated_at` is less than or equal to that instant. The cursor is the unpadded base64url encoding of `updated_at + "\n" + listing_id` of the last row returned. Clients treat it as opaque. Implementers use this encoding so tests do not need a secret.

Oracle: `updated_at` `2026-11-08T09:00:00Z` and `listing_id` `lst_01ARZ3NDEKTSV4RRFFQ69G5FAV` encode to

`MjAyNi0xMS0wOFQwOTowMDowMFoKbHN0XzAxQVJaM05ERUtUU1Y0UlJGRlE2OUc1RkFW`

A page is a JSON object:

```json
{
  "schema_version": "1.0.0",
  "feed": "active",
  "evaluation_time": "2026-11-08T12:00:00Z",
  "listings": [],
  "next_cursor": null
}
```

`next_cursor` is null on the last page. `listings` has at most `limit` items.

If one listing inside a page fails validation, the producer MUST NOT include it. The consumer, defending itself, skips a bad listing and records the error. It does not fail the whole page, except when `schema_version` has a different major, which fails the page with `unsupported_schema_version` on `schema_version`.

Page-level error object, the same shape as a validator error plus optional `listing_id`:

```json
{
  "code": "expired_deadline",
  "field": "deadline.fixed_at",
  "message": "expired_deadline: deadline.fixed_at",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FB2"
}
```

Logical codes for the sync and store, beyond the validator codes: `invalid_cursor` on `cursor`, `invalid_limit` on `limit`, `duplicate_listing` on `dedupe_key`, `revision_conflict` on `revision`, `unsupported_schema_version` on `schema_version`.

If a later card chooses HTTPS, this proposal's status mapping is: a page is success; a bad cursor or limit is a client error; a duplicate or revision conflict is a conflict; a single-listing validate call that fails stage 1 or 2 is a validation error. Status numbers are not assigned here, because there is no transport yet.

The consumer's sync cursor is per feed. PathSync does not assume the producer's `created_at` column order. The current Naija pages order by `created_at` descending. That is a website sort, not this sync order.

## 20. Distribution pin

**Proposed.** This path, `docs/data-contract.md` in `GoodnessOni/pathsync-ai`, is the only editable source of the contract. NaijaOpportunities does not keep a drifting copy of the prose.

After Goodness approves a commit, the first validator card pins that commit. It does not pin branch `rebuild/pathsync-v2`, and it does not pin `main`. This proposal is not yet an approved SHA. `git_sha` stays null until approval. Nobody should point a validator at this file's moving branch tip.

The pin the future card adds in the NaijaOpportunities repository, and not in this task, is a lock of this shape:

```json
{
  "consumer_repository": "GoodnessOni/pathsync-ai",
  "contract_path": "docs/data-contract.md",
  "git_sha": null,
  "schema_version": "1.0.0"
}
```

`git_sha` will be the 40-character lowercase SHA of the approved commit. The validator's test reads the file at that SHA (a checkout of that commit, or a byte-for-byte vendored copy accompanied by the same SHA). A test that fetches "latest" is a failed pin. When this contract changes, the same card that changes the validator updates the SHA. The previous SHA remains the definition of the previous version.

This task does not add that lock, does not open a pull request in the other repository, and does not merge this branch.

## 21. Synthetic samples

All seven fixtures use `synthetic: true`. Hosts end in `.example`. They are not live programmes. Hashes below are properties of the JSON objects, recomputed by the algorithm in section 16. Pretty printing is not significant. Key order in these blocks is for reading.

The two stage-1 failures set `content_hash` to 64 zeroes. `dedupe_key` is the real digest of kind and application URL. Those fields are not the defect. Stage 1 must stop before hashing.

`CONTRACT_EVALUATION_TIME` for every judgement in this section is `2026-11-08T12:00:00Z`.

### 21.1 Valid scholarship — fixed deadline, still open

Passes all three validator functions. The source date has no zone, so the resolved zone is Africa/Lagos and `fixed_at` is the measured instant `2027-03-31T22:59:59Z`. Citizenship is an explicit `NG` requirement. Ignoring `synthetic`, a student whose nationality is `NG` and whose course and CGPA fit would be included. Fresh until `2026-11-15T09:00:00Z`.

<!-- sample:valid-scholarship -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "kind": "scholarship",
  "synthetic": true,
  "revision": 1,
  "title": "River Trust Undergraduate Engineering Award 2027",
  "summary": "Synthetic award for Nigerian undergraduates in engineering and computer science.",
  "description": "A fictional foundation offers a one-year award for Nigerian university undergraduates studying engineering or computer science. This record is synthetic and is not a real scholarship.",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-2027",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/2027",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student"
    ],
    "fields_of_study": [
      "computer_science",
      "engineering"
    ],
    "year_of_study": [
      "200",
      "300",
      "400"
    ],
    "min_cgpa": {
      "scale": "5.0",
      "minimum_hundredths": 350,
      "class_equivalent": "second_class_upper"
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": true,
    "criteria_text": "Nigerian citizen. Undergraduate in 200, 300, or 400 level. Engineering or computer science. Minimum CGPA 3.50 on a 5.0 scale.",
    "citizenship": {
      "requirement": "explicit",
      "countries": [
        "NG"
      ]
    }
  },
  "deadline": {
    "kind": "fixed",
    "form": "date_only",
    "stated_timezone": null,
    "resolved_timezone": "Africa/Lagos",
    "display_date": "2027-03-31",
    "local_time": "23:59:59",
    "boundary": "inclusive_end_of_local_day",
    "fixed_at": "2027-03-31T22:59:59Z",
    "raw_text": "Closes 31 March 2027."
  },
  "award": {
    "kind": "cash",
    "summary": "200000 NGN for one academic year.",
    "currency": "NGN",
    "amount_minor": 20000000,
    "period": "per_year"
  },
  "location": {
    "country": "NG",
    "locality": null,
    "arrangement": "on_site"
  },
  "employment": null,
  "documents_required": [
    "CGPA transcript",
    "University ID"
  ],
  "how_to_apply": "Submit the synthetic form on the programme page.",
  "lifecycle": {
    "publication_status": "published",
    "status": "open",
    "closed_reason": null
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-08T09:00:00Z",
    "fresh_until": "2026-11-15T09:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T09:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "fe013cbe8335afaf831e075cc8a6ddd673dcd385033639950850e0038ddf9609",
  "content_hash": "eea1f8f31f86b2fb2a726acf4d2c2ac0aa01e7146f546166bb1fb8182c96d885",
  "supersedes": null
}
```

### 21.2 Valid internship — rolling deadline

Passes all three functions. `deadline.kind` is `rolling`. No date was invented. `citizenship.requirement` is `unconstrained`, which means the fictional source stated no nationality limit. Ignoring `synthetic`, it would be included for any student nationality.

<!-- sample:valid-internship -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FAW",
  "kind": "internship",
  "synthetic": true,
  "revision": 1,
  "title": "River Trust Campus Internship 2027",
  "summary": "Synthetic 12-week paid internship for Nigerian university students in computer science.",
  "description": "A fictional Lagos host offers a 12-week paid internship. Applications stay open on a rolling basis. This record is synthetic and is not a real internship.",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-intern-2027",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/interns/2027",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "postgraduate",
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student",
      "open_international"
    ],
    "fields_of_study": [
      "computer_science"
    ],
    "year_of_study": [
      "any"
    ],
    "min_cgpa": {
      "scale": "unknown",
      "minimum_hundredths": null,
      "class_equivalent": null
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": true,
    "criteria_text": "Open to Nigerian university students in computer science. No minimum CGPA is stated by the source.",
    "citizenship": {
      "requirement": "unconstrained",
      "countries": [
        "*"
      ]
    }
  },
  "deadline": {
    "kind": "rolling",
    "form": null,
    "stated_timezone": null,
    "resolved_timezone": null,
    "display_date": null,
    "local_time": null,
    "boundary": null,
    "fixed_at": null,
    "raw_text": "Applications are accepted on a rolling basis until positions are filled."
  },
  "award": {
    "kind": "stipend",
    "summary": "150000 NGN per month.",
    "currency": "NGN",
    "amount_minor": 15000000,
    "period": "per_month"
  },
  "location": {
    "country": "NG",
    "locality": "Lagos",
    "arrangement": "hybrid"
  },
  "employment": {
    "employment_type": "internship",
    "duration_text": "12 weeks",
    "paid": true
  },
  "documents_required": [
    "CV",
    "University ID"
  ],
  "how_to_apply": "Submit the synthetic internship form on the programme page.",
  "lifecycle": {
    "publication_status": "published",
    "status": "open",
    "closed_reason": null
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-08T09:00:00Z",
    "fresh_until": "2026-11-15T09:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T09:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "b1d7db3f769b7fc8a52a021d37bd8c8e77cb5834ca6795e897621e4bdfbfc984",
  "content_hash": "bbe4c50ecfd12ed5e149e6a2134b78d7a59d9918ae2f0deda8e2471f40449897",
  "supersedes": null
}
```

### 21.3 Valid job — unknown deadline and unknown citizenship

Passes all three functions. The unknown deadline is not expired and is not a fabricated date. `citizenship.requirement` is `unknown`, so the listing is not withheld for citizenship. `kind` is `job`, and jobs stay in student matching. Ignoring `synthetic`, this fixture would be included.

<!-- sample:valid-job -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FAX",
  "kind": "job",
  "synthetic": true,
  "revision": 1,
  "title": "River Trust Operations Analyst",
  "summary": "Synthetic full-time role. Citizenship requirements are not stated.",
  "description": "A fictional employer lists an operations analyst role in Abuja. The source does not state a closing date or a citizenship rule. This record is synthetic and is not a real job.",
  "provider": {
    "name": "River Transit Ltd",
    "type": "company",
    "country": "NG",
    "url": "https://rivertransit.example"
  },
  "source": {
    "name": "synthetic-board",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-transit-analyst",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/jobs/analyst",
    "url_kind": "aggregator_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "not_applicable"
    ],
    "audience_tags": [],
    "fields_of_study": [
      "unknown"
    ],
    "year_of_study": [
      "not_applicable"
    ],
    "min_cgpa": {
      "scale": "none",
      "minimum_hundredths": null,
      "class_equivalent": null
    },
    "institutions": {
      "scope": "not_applicable",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": false,
    "criteria_text": "Not stated by the source.",
    "citizenship": {
      "requirement": "unknown",
      "countries": []
    }
  },
  "deadline": {
    "kind": "unknown",
    "form": null,
    "stated_timezone": null,
    "resolved_timezone": null,
    "display_date": null,
    "local_time": null,
    "boundary": null,
    "fixed_at": null,
    "raw_text": null
  },
  "award": {
    "kind": "not_stated",
    "summary": null,
    "currency": null,
    "amount_minor": null,
    "period": null
  },
  "location": {
    "country": "NG",
    "locality": "Abuja",
    "arrangement": "on_site"
  },
  "employment": {
    "employment_type": "full_time",
    "duration_text": null,
    "paid": null
  },
  "documents_required": [],
  "how_to_apply": "Not stated by the source.",
  "lifecycle": {
    "publication_status": "published",
    "status": "open",
    "closed_reason": null
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-08T09:00:00Z",
    "fresh_until": "2026-11-15T09:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T09:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "007941f690b5ef4c9033f276aea54c382cf51d6de414538a1c84686021b1a1bb",
  "content_hash": "025d2d7838f523f28081662830bf2402a4583daab73ead9869cf37a3d1eba2aa",
  "supersedes": null
}
```

### 21.4 Valid historical scholarship — expired and retained

The source names the United Kingdom, so `stated_timezone` and `resolved_timezone` are `Europe/London`. End of 31 October 2026 in that zone is the measured instant `2026-10-31T23:59:59Z`, which is before the pin. The same date with no stated zone would have been `2026-10-31T22:59:59Z` in Africa/Lagos. `status` is `expired`. `expired_at` is `2026-11-01T00:00:00Z`, the next second. The row is also stale at the pin (`fresh_until` `2026-11-08T00:00:00Z`). Historical mode allows that. Active mode fails with `not_on_active_feed` on `lifecycle.status`, not with `expired_deadline`, because the producer already marked it expired.

<!-- sample:valid-historical-expired -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FAY",
  "kind": "scholarship",
  "synthetic": true,
  "revision": 2,
  "title": "River Trust Bridge Award 2026",
  "summary": "Synthetic award retained after its deadline for history. It is not open.",
  "description": "A fictional award whose closing date has passed. The source names the United Kingdom, so the deadline uses Europe/London rather than West Africa Time. The producer keeps the record and marks it expired. This record is synthetic.",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-bridge-2026",
    "retrieved_at": "2026-11-01T00:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/bridge-2026",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student"
    ],
    "fields_of_study": [
      "computer_science",
      "engineering"
    ],
    "year_of_study": [
      "200",
      "300",
      "400"
    ],
    "min_cgpa": {
      "scale": "5.0",
      "minimum_hundredths": 350,
      "class_equivalent": "second_class_upper"
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": true,
    "criteria_text": "Nigerian citizen. Undergraduate in 200, 300, or 400 level. Engineering or computer science. Minimum CGPA 3.50 on a 5.0 scale.",
    "citizenship": {
      "requirement": "explicit",
      "countries": [
        "NG"
      ]
    }
  },
  "deadline": {
    "kind": "fixed",
    "form": "date_only",
    "stated_timezone": "Europe/London",
    "resolved_timezone": "Europe/London",
    "display_date": "2026-10-31",
    "local_time": "23:59:59",
    "boundary": "inclusive_end_of_local_day",
    "fixed_at": "2026-10-31T23:59:59Z",
    "raw_text": "Closes 31 October 2026 (United Kingdom)."
  },
  "award": {
    "kind": "cash",
    "summary": "200000 NGN for one academic year.",
    "currency": "NGN",
    "amount_minor": 20000000,
    "period": "per_year"
  },
  "location": {
    "country": "NG",
    "locality": null,
    "arrangement": "on_site"
  },
  "employment": null,
  "documents_required": [
    "CGPA transcript",
    "University ID"
  ],
  "how_to_apply": "Submit the synthetic form on the programme page.",
  "lifecycle": {
    "publication_status": "published",
    "status": "expired",
    "closed_reason": "deadline_passed"
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-01T00:00:00Z",
    "fresh_until": "2026-11-08T00:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-09-01T08:00:00Z",
    "updated_at": "2026-11-01T00:00:00Z",
    "published_at": "2026-09-01T08:00:00Z",
    "expired_at": "2026-11-01T00:00:00Z",
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "40c390e2260ade57b9af50863b4d13e1b9edc72123a261f9c880eb62c4385a5a",
  "content_hash": "b7d35504f741c15389b79ee5f1c5e1cdb59fb8bb4fd17ec9ddf4aded25b3318c",
  "supersedes": null
}
```

### 21.5 Valid tombstone — withdrawn, id retained

Active mode fails with `not_on_active_feed` on `lifecycle.status`. Record and historical modes pass. Prose fields are `[withdrawn]`. The title and the deadline facts remain. `award` is `not_stated`, not a fake zero.

<!-- sample:valid-tombstone -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FB3",
  "kind": "scholarship",
  "synthetic": true,
  "revision": 2,
  "title": "River Trust Withdrawn Example 2027",
  "summary": "[withdrawn]",
  "description": "[withdrawn]",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-withdrawn-2027",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/withdrawn-2027",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student"
    ],
    "fields_of_study": [
      "computer_science",
      "engineering"
    ],
    "year_of_study": [
      "200",
      "300",
      "400"
    ],
    "min_cgpa": {
      "scale": "5.0",
      "minimum_hundredths": 350,
      "class_equivalent": "second_class_upper"
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": false,
    "criteria_text": "[withdrawn]",
    "citizenship": {
      "requirement": "explicit",
      "countries": [
        "NG"
      ]
    }
  },
  "deadline": {
    "kind": "fixed",
    "form": "date_only",
    "stated_timezone": null,
    "resolved_timezone": "Africa/Lagos",
    "display_date": "2027-03-31",
    "local_time": "23:59:59",
    "boundary": "inclusive_end_of_local_day",
    "fixed_at": "2027-03-31T22:59:59Z",
    "raw_text": "Closes 31 March 2027."
  },
  "award": {
    "kind": "not_stated",
    "summary": null,
    "currency": null,
    "amount_minor": null,
    "period": null
  },
  "location": {
    "country": "NG",
    "locality": null,
    "arrangement": "on_site"
  },
  "employment": null,
  "documents_required": [],
  "how_to_apply": "[withdrawn]",
  "lifecycle": {
    "publication_status": "withdrawn",
    "status": "closed",
    "closed_reason": "removed_by_producer"
  },
  "verification": {
    "state": "human_verified",
    "last_checked_at": "2026-11-08T10:00:00Z",
    "fresh_until": "2027-02-06T10:00:00Z",
    "method": "manual_review"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T10:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": "2026-11-08T10:00:00Z"
  },
  "dedupe_key": "2c4c09be0f200675e536c3df4c200b58a6473a71a2a226b3452f01d40563610c",
  "content_hash": "acd61b770a33343b35b7749da420a167a306f9ec736d4576fc975b747522ab12",
  "supersedes": null
}
```

### 21.6 Invalid — missing required field

`title` is absent. `validate_record` fails. The error names the field.

```json
{
  "code": "missing_required_field",
  "field": "title",
  "message": "missing_required_field: title"
}
```

<!-- sample:invalid-missing-title -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FB0",
  "kind": "scholarship",
  "synthetic": true,
  "revision": 1,
  "summary": "Synthetic award for Nigerian undergraduates in engineering and computer science.",
  "description": "A fictional foundation offers a one-year award for Nigerian university undergraduates studying engineering or computer science. This record is synthetic and is not a real scholarship.",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-2027",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/2027",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student"
    ],
    "fields_of_study": [
      "computer_science",
      "engineering"
    ],
    "year_of_study": [
      "200",
      "300",
      "400"
    ],
    "min_cgpa": {
      "scale": "5.0",
      "minimum_hundredths": 350,
      "class_equivalent": "second_class_upper"
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": true,
    "criteria_text": "Nigerian citizen. Undergraduate in 200, 300, or 400 level. Engineering or computer science. Minimum CGPA 3.50 on a 5.0 scale.",
    "citizenship": {
      "requirement": "explicit",
      "countries": [
        "NG"
      ]
    }
  },
  "deadline": {
    "kind": "fixed",
    "form": "date_only",
    "stated_timezone": null,
    "resolved_timezone": "Africa/Lagos",
    "display_date": "2027-03-31",
    "local_time": "23:59:59",
    "boundary": "inclusive_end_of_local_day",
    "fixed_at": "2027-03-31T22:59:59Z",
    "raw_text": "Closes 31 March 2027."
  },
  "award": {
    "kind": "cash",
    "summary": "200000 NGN for one academic year.",
    "currency": "NGN",
    "amount_minor": 20000000,
    "period": "per_year"
  },
  "location": {
    "country": "NG",
    "locality": null,
    "arrangement": "on_site"
  },
  "employment": null,
  "documents_required": [
    "CGPA transcript",
    "University ID"
  ],
  "how_to_apply": "Submit the synthetic form on the programme page.",
  "lifecycle": {
    "publication_status": "published",
    "status": "open",
    "closed_reason": null
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-08T09:00:00Z",
    "fresh_until": "2026-11-15T09:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T09:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "fe013cbe8335afaf831e075cc8a6ddd673dcd385033639950850e0038ddf9609",
  "content_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "supersedes": null
}
```

### 21.7 Invalid — wrong JSON type

`revision` is the string `"1"`, not an integer. `validate_record` fails. The error names the field.

```json
{
  "code": "invalid_type",
  "field": "revision",
  "message": "invalid_type: revision",
  "expected": "integer",
  "actual": "string"
}
```

<!-- sample:invalid-revision-type -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FB1",
  "kind": "scholarship",
  "synthetic": true,
  "revision": "1",
  "title": "River Trust Undergraduate Engineering Award 2027",
  "summary": "Synthetic award for Nigerian undergraduates in engineering and computer science.",
  "description": "A fictional foundation offers a one-year award for Nigerian university undergraduates studying engineering or computer science. This record is synthetic and is not a real scholarship.",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-2027",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/2027",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student"
    ],
    "fields_of_study": [
      "computer_science",
      "engineering"
    ],
    "year_of_study": [
      "200",
      "300",
      "400"
    ],
    "min_cgpa": {
      "scale": "5.0",
      "minimum_hundredths": 350,
      "class_equivalent": "second_class_upper"
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": true,
    "criteria_text": "Nigerian citizen. Undergraduate in 200, 300, or 400 level. Engineering or computer science. Minimum CGPA 3.50 on a 5.0 scale.",
    "citizenship": {
      "requirement": "explicit",
      "countries": [
        "NG"
      ]
    }
  },
  "deadline": {
    "kind": "fixed",
    "form": "date_only",
    "stated_timezone": null,
    "resolved_timezone": "Africa/Lagos",
    "display_date": "2027-03-31",
    "local_time": "23:59:59",
    "boundary": "inclusive_end_of_local_day",
    "fixed_at": "2027-03-31T22:59:59Z",
    "raw_text": "Closes 31 March 2027."
  },
  "award": {
    "kind": "cash",
    "summary": "200000 NGN for one academic year.",
    "currency": "NGN",
    "amount_minor": 20000000,
    "period": "per_year"
  },
  "location": {
    "country": "NG",
    "locality": null,
    "arrangement": "on_site"
  },
  "employment": null,
  "documents_required": [
    "CGPA transcript",
    "University ID"
  ],
  "how_to_apply": "Submit the synthetic form on the programme page.",
  "lifecycle": {
    "publication_status": "published",
    "status": "open",
    "closed_reason": null
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-08T09:00:00Z",
    "fresh_until": "2026-11-15T09:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T09:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "fe013cbe8335afaf831e075cc8a6ddd673dcd385033639950850e0038ddf9609",
  "content_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "supersedes": null
}
```

### 21.8 Invalid — expired deadline on the active feed

Stages 1 and 2 pass. `lifecycle.status` is still `open`. `fixed_at` is `2026-01-15T22:59:59Z`. At `2026-11-08T12:00:00Z` both `validate_active_feed` and `validate_historical` fail. The error names the field. The fix is not to delete the date and not to push the date forward. The retained shape is section 21.4.

```json
{
  "code": "expired_deadline",
  "field": "deadline.fixed_at",
  "message": "expired_deadline: deadline.fixed_at",
  "evaluation_time": "2026-11-08T12:00:00Z"
}
```

<!-- sample:invalid-expired-open -->
```json
{
  "schema_version": "1.0.0",
  "listing_id": "lst_01ARZ3NDEKTSV4RRFFQ69G5FB2",
  "kind": "scholarship",
  "synthetic": true,
  "revision": 1,
  "title": "River Trust Bridge Award 2026",
  "summary": "Synthetic award still marked open after its deadline. Validators must reject it on the active feed.",
  "description": "A fictional award whose closing instant has passed while lifecycle.status is still open. This is the active-feed rejection case. It is synthetic.",
  "provider": {
    "name": "River Trust",
    "type": "foundation",
    "country": "NG",
    "url": "https://rivertrust.example"
  },
  "source": {
    "name": "synthetic-directory",
    "kind": "aggregator",
    "url": "https://directory.example/listings/river-trust-bridge-2026-open",
    "retrieved_at": "2026-11-08T09:00:00Z"
  },
  "application": {
    "url": "https://apply.rivertrust.example/bridge-2026-open",
    "url_kind": "official_programme_page",
    "contact_email": null
  },
  "eligibility": {
    "education_levels": [
      "undergraduate"
    ],
    "audience_tags": [
      "nigerian_university_student"
    ],
    "fields_of_study": [
      "computer_science",
      "engineering"
    ],
    "year_of_study": [
      "200",
      "300",
      "400"
    ],
    "min_cgpa": {
      "scale": "5.0",
      "minimum_hundredths": 350,
      "class_equivalent": "second_class_upper"
    },
    "institutions": {
      "scope": "any_accredited_nigerian_tertiary",
      "names": []
    },
    "demographic_focus": [],
    "criteria_stated": true,
    "criteria_text": "Nigerian citizen. Undergraduate in 200, 300, or 400 level. Engineering or computer science. Minimum CGPA 3.50 on a 5.0 scale.",
    "citizenship": {
      "requirement": "explicit",
      "countries": [
        "NG"
      ]
    }
  },
  "deadline": {
    "kind": "fixed",
    "form": "date_only",
    "stated_timezone": null,
    "resolved_timezone": "Africa/Lagos",
    "display_date": "2026-01-15",
    "local_time": "23:59:59",
    "boundary": "inclusive_end_of_local_day",
    "fixed_at": "2026-01-15T22:59:59Z",
    "raw_text": "Closes 15 January 2026."
  },
  "award": {
    "kind": "cash",
    "summary": "200000 NGN for one academic year.",
    "currency": "NGN",
    "amount_minor": 20000000,
    "period": "per_year"
  },
  "location": {
    "country": "NG",
    "locality": null,
    "arrangement": "on_site"
  },
  "employment": null,
  "documents_required": [
    "CGPA transcript",
    "University ID"
  ],
  "how_to_apply": "Submit the synthetic form on the programme page.",
  "lifecycle": {
    "publication_status": "published",
    "status": "open",
    "closed_reason": null
  },
  "verification": {
    "state": "machine_checked",
    "last_checked_at": "2026-11-08T09:00:00Z",
    "fresh_until": "2026-11-15T09:00:00Z",
    "method": "page_fetch"
  },
  "timestamps": {
    "created_at": "2026-10-01T08:00:00Z",
    "updated_at": "2026-11-08T09:00:00Z",
    "published_at": "2026-10-01T08:00:00Z",
    "expired_at": null,
    "closed_at": null,
    "withdrawn_at": null
  },
  "dedupe_key": "8c74fbc06dcf6a0657d31d2ea77e949657dd5a5e51c01ae01667d7557d2988d6",
  "content_hash": "c36f3fe721781eb394690bd583e64d735e9af1a869630020bb890a517c4e8493",
  "supersedes": null
}
```

## 22. Uncertainties

These were not resolved by inventing a value.

1. Live Supabase contents for either product were not queried on 8 November 2026. Row counts, the real column types of the hosted `scholarships` and `jobs` tables, and whether the four SQL seed rows are loaded are unknown. The "72 vectors of 1024 dimensions" note is a 1 November 2026 decision-record observation, not a new measurement.
2. Whether the NaijaOpportunities GitHub Action is actually scheduled off is unknown. This repo's runbook says it has been disabled since 19 August 2026 and cites an inventory that is not here. The workflow YAML at commit `c737b4f` still contains a 6-hour cron.
3. Which public hostname is canonical is unknown. The Naija README names both `naija-opportunities.vercel.app` and `www.naijaopportunities.live`. PathSync's UI links only to the Vercel host.
4. No listings HTTP API was found. Section 19 is not a description of a deployed route. PathSync's ingest route writes the local schema and is not a sync client.
5. How `short_id` and `slug` are populated in NaijaOpportunities is unknown. They are on the TypeScript interfaces and not in the scraper payloads that were inspected. The page builds a slug from the title and `short_id`.
6. Internships are not a stored kind in that scraper at the observed commit. Adding `kind=internship` is proposed.
7. The seed application URLs in `backend/schema.sql` were not opened. They are not evidence of a working application form.
8. Server timezone for `datetime.now()` on the current host is unknown. That is one reason the proposal refuses wall-clock checks.
9. Architecture decision 0002's heading says accepted and its closing lines say proposed. This contract does not resolve that. Embeddings stay out of the listing.
10. The README deployment story (Render) and decision 0001 (Heroku) disagree. Hosting is out of scope.
11. Whether a human editor currently reviews listings before they reach students is unknown. The `human_verified` state is available for when that happens. It is not a claim that it happens today.
12. The 7-day and 90-day freshness windows and the 730-day dedupe reservation are still proposals (section 5). They are not measurements of current scraper behaviour. West Africa Time as the default for a date with no stated zone is a settled instruction. The sample instants were measured with tzdata 2026e.
13. No count was made of live listings that lack a citizenship value. Coverage is unknown.

## 23. Out of scope and non-goals

This file does not implement a product validator, a scraper, a migration, or a sync client. `docs/listings/compute_listing_hashes.py` only recomputes the documented digests for the synthetic fixtures. This revision does not start the planner card. It does not change NaijaOpportunities, `main`, account settings, or billing. It does not authorise deployment. It does not submit applications. It does not decide embeddings, hosting, or edit the onboarding screen. Personal student data is not copied into the samples.

## 24. Approval record

| Field | Value |
| --- | --- |
| Status | Pending owner approval |
| Owner | Goodness |
| Approved SHA | — |
| Approved on (Africa/Lagos date) | — |
| Amendments | — |

No planner card may start while the approved SHA is blank. The first card after a SHA is written here is the NaijaOpportunities listings validator described in the status block at the top. Its done test is the table in section 18. That card is not started.

## 25. Completeness checklist

The lead considers this document complete for approval review only when each line is true of this file:

- Purpose, scope, and producer/consumer duties are stated.
- Current README and code facts are separated from proposed rules and from uncertainties.
- Field tables give name, type, required, nullability, and constraints.
- Stable `listing_id` is defined and is not a URL or a title slug.
- Scholarship, internship, and job are specified, and the PathSync filter is separate from producer validity.
- Jobs stay in student matching. Unknown listing citizenship does not withhold a student. Only an explicit list that misses the student's nationality does.
- Source and application URLs, provenance, verification, and freshness are specified.
- Publication, closed, expired, and withdrawn states are specified.
- Deduplication, immutable application URL, revisioned update, and tombstone deletion are specified.
- Timestamps are UTC to the second. A date-only deadline ends at 23:59:59 in the stated zone, or in Africa/Lagos when no zone is stated. `evaluation_time` is an argument.
- Rolling and unknown deadlines have no fabricated dates.
- Version `1.0.0` and major/minor/patch rules are specified.
- Sync and pagination are proposed and labelled as not an existing endpoint.
- Privacy limits and a non-model sanitiser are specified.
- Five synthetic valid listings and three invalid listings are embedded, including missing `title`, string `revision`, and expired `deadline.fixed_at`.
- Active-feed expiry rejection is distinguished from retained expired history.
- The pin back to this PathSync file is specified, with `git_sha` null until approval.
- Uncertainties are listed instead of invented APIs or live database facts.
