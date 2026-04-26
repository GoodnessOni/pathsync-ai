"""
PathSync AI — Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "PathSync AI"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "https://pathsync.ai"]

    # Anthropic
    ANTHROPIC_API_KEY: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    DATABASE_URL: str  # postgres://user:pass@host/db

    # Redis (for session state)
    REDIS_URL: str = "redis://localhost:6379"

    # Embedding model
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_API_KEY: str = ""  # used only for embeddings if desired

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
