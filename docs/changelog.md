This page is the change history for the PathSync rebuild. The audience is a person who arrives about six months after 9 November 2026 and needs to see what changed, why it changed, and the effect.

## Unreleased
- 2026-11-01: Rebuild branch created (rebuild/pathsync-v2). Documentation structure added: architecture.md, data-model.md, changelog.md, runbook.md, decisions/. Commit 0742961. Docs updated: all new.

- 2026-11-01: Removed stray file created by a mistyped git command ("et --hard <8b3eca1>"). Commit 600cb7d. Docs updated: changelog.md.
- 2026-11-01: Renamed frontend/src/lib/confiq.js to frontend/src/config.js to match the imports in Dashboard.jsx and Matches.jsx. Commit debda53. Docs updated: changelog.md.
- 2026-11-01: Added data-model.md placeholder, to be completed in Phase 1. Docs updated: data-model.md, changelog.md.

- 2026-11-01: Decision 0001: backend hosting moved to Heroku, paid by GitHub Student Pack credit (ADR 0001). Docs updated: decisions/0001-hosting.md, changelog.md.

- 2026-11-01: Audit of rag_service.py (matching path) recorded. Proposed direction: rules first, models on a shortlist only, pending labelled test. ADR 0002 status set to proposed. Docs updated: audit/rag_service.md, decisions/0002-embedding-model.md, changelog.md.

- 2026-11-09: Added docs/decision-log.md and docs/glossary.md. What changed: a decision log of the pinned listing rules, a glossary of those terms, and this line. The log records OGverse Lead's report of a 00:28 WAT policy-approval chat on 9 November 2026, distinct from the 00:25:31 WAT git author time, and keeps the reported corrected-pin approval at 00:42 WAT. Why: a newcomer needs the decisions, the reasons the contract states, the motives it leaves undocumented, and the handover, with the contract still the rule. Effects: start at the decision log, then check each rule against commit b50440dc738d86ff3070386d8709b8faf2bc5982. The contract, scripts, product code, main, and the 1 November 2026 notes above are unchanged. No product rule was added or amended. Docs updated: decision-log.md, glossary.md, changelog.md.

- 2026-11-09: Recorded OGverse Lead's 02:11 WAT report on syntax checks and human review for ambiguous evidence. What changed: an update in the decision log, short glossary notes, and this line. Why: the report has to sit beside the pinned contract, and the validator handover needed a current status, without turning the chat into a contract amendment. Effects: the contract pin stays b50440dc738d86ff3070386d8709b8faf2bc5982. Test counts stay Lead's report of Test. A validator pass is not recorded as successful verification, genuine evidence, release readiness, or a finished human-review workflow. The contract file is unchanged. Docs updated: decision-log.md, glossary.md, changelog.md.

- 2026-11-09: Recorded OGverse Lead's acceptance of Card 2, the producer verification attempt gate, as a bounded primitive only. What changed: a Card 2 update in the decision log, glossary entries for decide_attempt, assessment, attempt gate, and bounded primitive, and this line. Why: the gate has to sit beside the 02:11 human-review report without being mistaken for that workflow or for a contract change. Effects: readers can see the reported meaning and the unimplemented limits. The contract pin stays b50440dc738d86ff3070386d8709b8faf2bc5982. Measurements stay Lead's report of Test. The page does not call the gate production-ready or release-ready, and it does not close human-review routing. Docs updated: decision-log.md, glossary.md, changelog.md.

- 2026-11-09: Recorded the trusted-caller decision and Card 3, the offline human-review queue (NaijaOpportunities ab303c9). Why: Lead decided and accepted both at 13:59 WAT with Goodness's approval. Effect: assessments from students, the public API or listing data are out of scope. Lead's measured results are kept separate from the agent's reported ones. Authorisation, storage and publication remain open.

- 2026-11-09: Recorded Card 4, the offline active-feed publisher (NaijaOpportunities 065c666), and restyled the trusted-caller, human-review queue and human_resolved glossary entries to the page's "**Term.** text" style. Why: Lead accepted Card 4 at 14:04 WAT with Goodness's approval, and the 1377266 entries did not match the rest of the glossary. Effect: readers can see which listings the feed includes, the five exclusion reasons and the fresh_until boundary. Lead's measured results are kept separate from the agent's reported ones. Reviewer authorisation, durable storage and a live endpoint remain open. Docs updated: decision-log.md, glossary.md, changelog.md.

## How to check this page later

1. Read the newest Unreleased line and open the files it names. Expected result: you find the decision log and the glossary.
2. Compare a rule in the decision log with the contract SHA named in that line. Expected result: the rule matches that file, or you stop and ask OGverse Lead.
3. Ask OGverse Lead before you treat a handover sentence as still current. Expected result: Lead confirms or corrects it. This page does not publish itself and does not dispatch work.
