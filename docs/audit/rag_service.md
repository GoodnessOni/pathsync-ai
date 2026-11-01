# Audit: backend/app/services/rag_service.py

Date: 1 Nov 2026
Status: complete for the matching path; generation and ingest paths noted, not fully reviewed.

## What it does
Given a session ID, it loads the student's profile, builds a text summary, embeds that summary, runs a pgvector similarity search through the Supabase function match_scholarships, removes results that fail a CGPA check, and asks Claude Haiku for a one-sentence reason per result. It returns the top three.

## Inputs and outputs
- Input: session_id, top_k (default 3), threshold (default 0.60).
- Reads: student_profiles (full row, including demographics and goal).
- Writes: nothing on the matching path. ingest_scholarship writes to scholarships with an embedding.
- Output: up to three scholarship rows with match_reason.

## Dependencies
- Anthropic (Claude Haiku) for match explanations, one call per request.
- OpenAI text-embedding-3-small for embeddings, when OPENAI_API_KEY is set.
- Supabase: Postgres with pgvector, and a function match_scholarships.

## Failure modes
1. No OPENAI_API_KEY: generate_embedding_with_claude returns a zero vector. Cosine similarity against a zero vector is undefined, so matching returns nothing or noise, with no error.
2. Dimension mismatch: OpenAI produces 1536 dimensions. The 72 stored scholarship vectors are 1024 (Cohere). The comparison cannot be valid.
3. Explanation parsing: if the model's JSON fails to parse, every result receives the same generic text.
4. Expired listings: the only post-filter is CGPA. An expired scholarship can be returned.
5. Threshold: 0.60 is hard-coded and has not been tested against real scores.

## Cost and latency per request
- One embedding call for the profile.
- One Claude Haiku call for explanations.
- Per listing: none on the matching path, but every listing must be embedded at ingest.

## Personal data
The full profile is read, including demographics and the goal. The profile text sent to the embedding provider includes CGPA, level, skills, achievements and strong courses. Consent is not checked on this path.

## Naming and documentation
The function generate_embedding_with_claude does not use Claude. Its docstring says "Claude's embedding-compatible approach". The name is misleading and should be changed in the rebuild.

## Verdict
Replace in the rebuild. Keep the pipeline shape (profile, filter, rank, explain), but:
- Apply hard eligibility and deadline filters in SQL before any ranking.
- Rank with structured fields first.
- Use a model only on a small shortlist, for the fuzzy requirement match.
- Never return a zero vector; fail loudly.
- Store the reason for each match, and its source (rule or model).

## Proposed direction (for ADR 0002, not yet decided)
The current code embeds every profile and every listing to do work that rules and a small shortlist could do more cheaply and transparently. Decide after the labelled test (30 to 50 profiles, precision at three, recall, cost per 1,000 matches), comparing: structured rules only, rules plus a model on the shortlist, and rules plus embeddings.