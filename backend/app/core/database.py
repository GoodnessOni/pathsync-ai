"""
PathSync AI — Database Initialization (Supabase + pgvector)
"""
import asyncpg
from app.core.config import settings

_pool = None


async def init_db():
    global _pool
    _pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=2, max_size=10)
    # Ensure pgvector extension is enabled
    async with _pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    print("✅ Database pool initialized with pgvector")


async def get_pool():
    return _pool
