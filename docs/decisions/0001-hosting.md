# 0001: Hosting for the PathSync backend

Status: accepted
Date: 1 Nov 2026

## Context
The backend (FastAPI) runs on Render's free instance, which spins down when idle. The first request can take 50 seconds or more, which is unacceptable for onboarding and the 2 November interview. The frontend is on Vercel and the database is on Supabase; neither changes here.

## Decision
Host the PathSync backend on Heroku, paid by the GitHub Student Developer Pack credit ($13 per month for 24 months, per the pack page checked 1 Nov 2026).

## Alternatives considered
- Keep Render free: no cost, but cold starts remain.
- Render paid instance (about $7 per month): removes cold starts, costs money from the start.
- Railway: no permanent free tier; paid from the first month.
- Google Cloud Run: scales to zero, near-zero cost when idle; more setup. Kept as the fallback if the Heroku credit runs out.
- Azure credit ($100): kept for future containers.

## Consequences
- The backend deploys from the repository's backend/ folder with a Procfile or equivalent.
- Environment variables move to Heroku config vars. Record names only in the runbook.
- Credit runs for 24 months, so the choice needs a review before month 24.

## Still to verify before first deploy
- The credit covers the dyno size we need (check the Heroku plan list against the credit).
- The pack's Heroku offer is active on the verified account.
- Heroku's current rules for Python apps (buildpack and runtime version).
