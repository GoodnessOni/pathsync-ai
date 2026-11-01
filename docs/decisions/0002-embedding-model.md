# 0002: Embedding model for matching

Status: accepted
Date: 1 Nov 2026

## Context
The backend has two embedding paths:
- Cohere: used by /api/v1/matches (backend/app/api/matches.py) and by scripts/generate_embeddings.py.
- OpenAI text-embedding-3-small (1536 dimensions): used by rag_service.py, which is called by chat.py, generate.py and scholarships.py.

The scholarships table holds 72 vectors with 1024 dimensions, which matches Cohere's output. Jobs has no embedding column. The OpenAI path produces 1536-dimension vectors that cannot be compared with the stored data.

## Decision
Use Cohere for all embeddings. Remove the OpenAI embedding path from rag_service.py, and remove OPENAI_API_KEY from config.py, .env.example and render.yaml.

## Alternatives considered
- Keep OpenAI and regenerate all vectors: higher quality is possible, but it needs a migration of the stored vectors and a new cost.
- Keep both: rejected, because vectors from the two models cannot be compared.

## Consequences
- COHERE_API_KEY becomes required. It must be set in Render and in each local .env.
- Any vector written in the future must come from Cohere, or the stored data must be regenerated.
- Jobs needs an embedding column before it can be matched by similarity. That is a schema change for Phase 2.

## Verification before merge
- No file imports OpenAI for embeddings after removal (grep).
- The matching route returns results on a test profile.
- Cohere output dimension is confirmed as 1024 for the model in use.

Status: proposed. Decision deferred until the labelled test is run. See docs/audit/rag_service.md.

