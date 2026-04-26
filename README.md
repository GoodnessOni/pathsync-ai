# PathSync AI 🎓

<div align="center">

**AI-powered scholarship discovery, matching, and application system for Nigerian university students.**

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Anthropic](https://img.shields.io/badge/Claude-AI-orange)](https://anthropic.com)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## The Problem

Nigeria has **1.8 million active undergraduates** and over **₦50 billion in scholarship funds** that go unclaimed every year — not because the money doesn't exist, but because students and funders can't find each other.

Most Nigerian students lose scholarships not because they don't qualify — but because they can't describe themselves properly. A student who runs a street football league doesn't know that's *Project Coordination and Community Leadership*. A student who manages their church's social media doesn't know that's *Digital Communications and Community Engagement*.

**PathSync AI fixes that.**

---

## What PathSync AI Does

### 1. 💬 Discovery Interview
A student has a real conversation with Claude (Anthropic's AI). The AI conducts a structured interview — asking about CGPA, course, and crucially, what the student does *outside* lectures.

### 2. 🧠 Hidden Achievement Engine
PathSync translates everyday student language into formal, fundable competencies:

| What the student says | What PathSync hears |
|---|---|
| "I run a street football league" | Project Coordination & Community Leadership |
| "I manage my church's social media" | Digital Communications & Community Engagement |
| "I tutor my classmates in maths" | Peer Education, Mentorship & Curriculum Delivery |
| "I do small business selling provisions" | Entrepreneurship & Financial Management |
| "I'm the class rep" | Student Government & Stakeholder Liaison |

### 3. 🎯 Scholarship Matching
RAG-based vector similarity search across a live knowledge base of Nigerian scholarships — MTN Foundation, Shell Nigeria, NLNG, TETFUND and more — matching the student's full profile, not just keywords.

### 4. ✉️ Application Letter Generator
One click generates a complete, personalised, formal scholarship application letter using everything Claude learned about the student in the interview.

### 5. 📄 CV Generator
Automatically builds a scholarship-optimised CV — translating every informal activity into a professional competency.

### 6. 📅 Deadline Tracker
A personalised action plan for every matched scholarship — specific steps, documents needed, and days remaining.

### 7. 🔒 Privacy Gateway
All student input passes through a two-layer PII scrubber **before** touching any LLM:
- **Regex layer** — strips Nigerian phone numbers, NIN, BVN, emails, addresses
- **spaCy NER layer** — removes PERSON, LOC, GPE entities

Only **Academic DNA** (CGPA, major, skills, achievements) reaches the AI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     STUDENT BROWSER                          │
│              React (Vite) — PathSync AI Dashboard            │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│                                                              │
│  Privacy Middleware → PDF Parser → Discovery Chat            │
│  Generation Service → RAG Vector Search → Cost Optimizer     │
└──────────┬──────────────────────────┬────────────────────────┘
           │                          │
┌──────────▼──────────┐  ┌────────────▼──────────────────────┐
│   ANTHROPIC API     │  │       SUPABASE (PostgreSQL)        │
│  claude-sonnet-4    │  │  scholarships  (vector 1536-dim)  │
│  claude-haiku-4-5   │  │  student_profiles (anonymous)     │
│  Prompt Caching     │  │  chat_sessions  (full history)    │
└─────────────────────┘  └────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Engine | Anthropic Claude (Sonnet 4 + Haiku 4.5) |
| Backend | FastAPI + Python 3.12 |
| Database | Supabase (PostgreSQL + pgvector) |
| PDF Parsing | pdfplumber + PyMuPDF |
| NLP / Privacy | spaCy (en_core_web_sm) |
| Frontend | React 18 + Vite |
| Deployment | Render.com + Docker |

---

## Project Structure

```
pathsync-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── chat.py               # Chat, transcript, match endpoints
│   │   │   ├── generate.py           # CV, letter, deadline tracker
│   │   │   ├── scholarships.py       # Scholarship ingestion
│   │   │   ├── profile.py            # Student profile
│   │   │   └── health.py
│   │   ├── core/
│   │   │   ├── config.py             # Environment settings
│   │   │   └── database.py           # asyncpg + pgvector
│   │   ├── middleware/
│   │   │   └── privacy.py            # PII redaction
│   │   └── services/
│   │       ├── chat_service.py       # Discovery interview + sessions
│   │       ├── pdf_parser.py         # Transcript parsing
│   │       ├── rag_service.py        # Vector search
│   │       ├── generation_service.py # CV + letter + tracker
│   │       └── cost_optimizer.py     # Model tiering + caching
│   ├── schema.sql                    # Supabase schema + seed data
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- [Supabase](https://supabase.com) project (free tier)
- [Anthropic API key](https://console.anthropic.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/pathsync-ai.git
cd pathsync-ai
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Fill in your keys in backend/.env
```

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
OPENAI_API_KEY=        # optional — leave blank for local embeddings
REDIS_URL=redis://localhost:6379
DEBUG=false
ALLOWED_ORIGINS=["http://localhost:5173"]
```

### 3. Set up Supabase
Open Supabase → SQL Editor → paste the contents of `backend/schema.sql` → Run.

### 4. Run locally (no Docker)

**Terminal 1 — Backend:**
```bash
cd backend

# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Mac/Linux
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** 🚀

### 5. Run with Docker
```bash
docker compose up --build
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/chat/message` | Send a discovery interview message |
| `POST` | `/api/v1/chat/match` | Get top-K scholarship matches |
| `POST` | `/api/v1/chat/upload-transcript` | Upload + parse PDF transcript |
| `DELETE` | `/api/v1/chat/session/{id}` | Reset a session |
| `GET` | `/api/v1/profile/{session_id}` | Get anonymised student profile |
| `POST` | `/api/v1/generate/letter` | Generate application letter |
| `POST` | `/api/v1/generate/cv` | Generate scholarship CV |
| `POST` | `/api/v1/generate/tracker` | Generate deadline tracker |
| `POST` | `/api/v1/scholarships/ingest` | Add scholarship to knowledge base |

Full interactive docs: **http://localhost:8000/docs**

---

## Cost Optimisation

### Model Tiering
| Task | Model | Why |
|---|---|---|
| Chat turns | claude-haiku-4-5 | Fast + cheap (~$0.0002/conversation) |
| CV + letter generation | claude-haiku-4-5 | Sufficient for structured output |
| PDF transcript parsing | claude-sonnet-4 | Accuracy critical |

### Prompt Caching
System prompt cached using `cache_control: ephemeral` — saves ~90% on input tokens for returning users.

---

## Scalability

- **Stateless FastAPI** — run N replicas behind a load balancer
- **Supabase session storage** — any replica serves any request
- **pgvector IVFFlat index** — sub-10ms search at millions of vectors
- **1,000+ concurrent users** on a $25/month Render instance

---

## Privacy & Security

- Zero PII stored — all identifiers redacted before any LLM call
- Anonymous sessions — no account required, no data breach risk
- HTTPS enforced on all deployments

---

## Deploy to Render

```bash
git push origin main
# Go to render.com → New → Blueprint → connect repo
# Set env vars in Render dashboard → Apply
```

---

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

> *"It finds the scholarships. Writes the letter. Builds the CV. Tracks every deadline.*
> ***It does everything except submit the application.***"

**Built by ONI Goodness Oluwapelumi · Nigeria 🇳🇬**

*PathSync AI — Equity engine for Nigerian students*

</div>
