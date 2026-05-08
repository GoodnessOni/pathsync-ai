"""
Generate embeddings using Cohere (FREE tier)
"""
import asyncio
import asyncpg
import cohere
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

co = cohere.Client(os.getenv("COHERE_API_KEY"))
DATABASE_URL = os.getenv("DATABASE_URL")

def build_scholarship_text(scholarship: dict) -> str:
    """Build rich text for embedding."""
    parts = [
        f"{scholarship['title']} by {scholarship['provider']}",
        f"Description: {scholarship.get('description', '')}",
        f"Eligibility: {scholarship.get('eligibility', '')}",
        f"Benefits: {scholarship.get('benefits', '')}",
        f"Level: {scholarship.get('level', '')}",
        f"Country: {scholarship.get('country', '')}",
    ]
    return ". ".join([p for p in parts if p and str(p) != 'None'])

def generate_embedding(text: str) -> list:
    """Generate embedding using Cohere (FREE)."""
    try:
        response = co.embed(
            texts=[text[:2000]],
            model='embed-english-v3.0',
            input_type='search_document'
        )
        return response.embeddings[0]
    except Exception as e:
        print(f"Error: {e}")
        return None

async def main():
    print("🔌 Connecting to database...")
    # Add statement_cache_size=0 to fix pgbouncer issue
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)
    
    print("📊 Fetching scholarships...")
    scholarships = await conn.fetch(
        """SELECT id, title, provider, description, eligibility, 
                  benefits, level, country
           FROM scholarships 
           WHERE embedding IS NULL
           ORDER BY created_at DESC
           LIMIT 100"""
    )
    
    print(f"\n✨ Found {len(scholarships)} scholarships to process\n")
    
    if len(scholarships) == 0:
        print("✅ All scholarships already have embeddings!")
        await conn.close()
        return
    
    success_count = 0
    for i, scholarship in enumerate(scholarships, 1):
        s_dict = dict(scholarship)
        
        text = build_scholarship_text(s_dict)
        embedding = generate_embedding(text)
        
        if embedding:
            # Convert list to string format for pgvector
            embedding_str = str(embedding)
            
            await conn.execute(
                "UPDATE scholarships SET embedding = $1::vector WHERE id = $2",
                embedding_str,
                s_dict['id']
            )
            success_count += 1
            print(f"✅ {i}/{len(scholarships)}: {s_dict['title'][:60]}...")
        else:
            print(f"❌ {i}/{len(scholarships)}: Failed - {s_dict['title'][:60]}...")
    
    await conn.close()
    print(f"\n🎉 Done! Generated embeddings for {success_count}/{len(scholarships)} scholarships")
    print(f"💰 Cost: $0.00 (FREE tier!)")

if __name__ == "__main__":
    asyncio.run(main())
