# PathSync Application Readiness Checker

A small prototype built for the WaleLab NextGen AI Hackathon (Track 2: Bridging the University-to-Work Gap). Team: Goodness Oni and David Gilbert. Deadline: Thursday 12 November 2026, 9:00 AM Africa/Lagos.

This folder is a standalone web app. It does not change the live PathSync app.

## What it is

[PathSync](https://pathsync-ai.vercel.app) helps Nigerian university students find scholarships, internships and jobs, and prepare applications. Listings come from [NaijaOpportunities](https://naijaopportunities.live).

This checker is a new practice layer on top of that idea. A student picks a listing (or pastes one), pastes their application essay or personal statement, and gets feedback against the listing's stated selection criteria. They can revise and re-score, and see whether their readiness score improved. The tool never submits an application.

A quick look did not find a public JSON API on NaijaOpportunities, so the app ships with clearly labelled SAMPLE listings and a box to paste listing text from the NaijaOpportunities site (or any official listing page).

## How it works

1. The student chooses a sample listing or pastes listing text, then pastes their essay.
2. The browser sends that text to a single Vercel serverless function (`api/check.js`). The essay is not saved on a server.
3. The function calls Groq's free-tier Llama model and asks it to:
   - extract only criteria that are stated in the listing
   - score the essay per criterion as met, partly, or missing
   - quote short lines from the student's own essay as evidence
   - give concrete revision suggestions
4. The function computes a readiness score from those ratings (met = 1, partly = 0.5, missing = 0). Criteria marked "not stated" are shown but not scored.
5. Score history is stored in the browser only (`localStorage`). Clearing site data clears the history.

The on-screen disclaimer is part of the product: this is guidance, not a prediction of selection. The model is instructed not to invent criteria that the listing does not state.

If `GROQ_API_KEY` is not set, the function returns a clearly labelled demo response so the interface still works.

## How to deploy on Vercel

You need a Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys) (free tier).

1. Open [Vercel](https://vercel.com) and import the GitHub repository `GoodnessOni/pathsync-ai`.
2. Set the branch to `walelab-essay-checker` (not `main`, and not `rebuild/pathsync-v2`).
3. Set Root Directory to `walelab-checker`.
4. Add an environment variable:
   - Name: `GROQ_API_KEY`
   - Value: the key from the Groq console
5. Optional: `GROQ_MODEL` (defaults to `llama-3.3-70b-versatile`).
6. Deploy. The app will be at the URL Vercel gives you. The API route is `/api/check`.

Framework preset can stay as "Other". No build command is required. The output is static files plus the serverless function.

### Run it locally (demo mode, no key)

```bash
cd walelab-checker
node api/check.js
```

Then open http://localhost:3000. Without a key, scoring uses the labelled demo response. To use Groq locally, create a `.env` file in this folder with `GROQ_API_KEY=...` or export the variable in your shell. The `.env` file is gitignored. Do not commit a key.

## Disclosure

### Pre-existing work (before this hackathon)

- The live PathSync application at https://pathsync-ai.vercel.app, including matching, profile and application-prep features already on that site.
- NaijaOpportunities at https://naijaopportunities.live, the listings source PathSync already uses.
- The existing `pathsync-ai` repository (`main` and other older branches).

### Work built for this hackathon

- This Application Readiness Checker: the pages, scoring API, revise-and-rescore loop, and browser-only score history in the `walelab-checker/` folder on the `walelab-essay-checker` branch.
- The design choice to practise a real application task against a listing's stated criteria, with evidence quotes and an improvement record, rather than only listing or rewriting documents.

### AI tools used

- Groq API (Llama model, default `llama-3.3-70b-versatile`) for essay feedback at runtime.
- AI coding assistance to help write this prototype.

No usage statistics or judged test results are claimed here. Try the app with a sample listing and a draft essay to see how the feedback looks.
