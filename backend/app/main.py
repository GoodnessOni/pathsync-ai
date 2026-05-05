"""
PathSync AI — Main FastAPI Application
UNILAG Hackathon 2026
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import chat, scholarships, profile, health
from app.core.config import settings
from app.core.database import init_db
from app.api import generate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await init_db()
    yield


app = FastAPI(
    title="PathSync AI",
    description="AI-powered student financial support system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(scholarships.router, prefix="/api/v1/scholarships", tags=["Scholarships"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(generate.router, prefix="/api/v1/generate", tags=["Generate"])

@app.get("/")
async def root():
    return {"message": "PathSync AI is live 🚀", "version": "1.0.0"}
