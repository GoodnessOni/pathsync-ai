-- ============================================================
-- PathSync AI — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Scholarships knowledge base
CREATE TABLE IF NOT EXISTS scholarships (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    provider      TEXT NOT NULL,                        -- e.g. MTN, Shell, NLNG
    description   TEXT NOT NULL,
    eligibility_criteria TEXT NOT NULL,
    min_cgpa      NUMERIC(3,2),                        -- e.g. 3.50
    eligible_majors TEXT[],                            -- e.g. ARRAY['Engineering','Sciences']
    amount        TEXT,                                 -- e.g. ₦500,000/year
    deadline      DATE,
    application_url TEXT,
    embedding     vector(1536),                        -- OpenAI text-embedding-3-small dim
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student profiles (anonymised — no PII stored)
CREATE TABLE IF NOT EXISTS student_profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    TEXT UNIQUE NOT NULL,                -- anonymous session token
    cgpa          NUMERIC(3,2),
    major         TEXT,
    level         TEXT,                                -- 100L, 200L, etc.
    semester_grades JSONB,                             -- { "100_1": {"courses": [...]} }
    soft_skills   TEXT[],                              -- extracted by Claude
    achievements  TEXT[],
    embedding     vector(1536),                        -- profile embedding for matching
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Chat sessions (persisted context)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    TEXT UNIQUE NOT NULL,
    messages      JSONB DEFAULT '[]'::jsonb,           -- [{role, content}, ...]
    stage         TEXT DEFAULT 'onboarding',           -- onboarding | discovery | matching
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Similarity search function (pgvector cosine distance)
CREATE OR REPLACE FUNCTION match_scholarships(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.70,
    match_count     INT    DEFAULT 3
)
RETURNS TABLE (
    id                   UUID,
    title                TEXT,
    provider             TEXT,
    description          TEXT,
    eligibility_criteria TEXT,
    amount               TEXT,
    deadline             DATE,
    application_url      TEXT,
    similarity           FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.title,
        s.provider,
        s.description,
        s.eligibility_criteria,
        s.amount,
        s.deadline,
        s.application_url,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM scholarships s
    WHERE 1 - (s.embedding <=> query_embedding) > match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS scholarships_embedding_idx
    ON scholarships USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS profiles_embedding_idx
    ON student_profiles USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- 7. Seed data — sample scholarships
INSERT INTO scholarships (title, provider, description, eligibility_criteria, min_cgpa, eligible_majors, amount, deadline, application_url)
VALUES
(
    'MTN Foundation Science & Technology Scholarship',
    'MTN Nigeria',
    'Supports outstanding Nigerian undergraduates studying STEM fields with demonstrated financial need.',
    'Nigerian citizen, 200L–400L, CGPA ≥ 3.5/5.0, studying Engineering, Computer Science, Mathematics or Physics.',
    3.50,
    ARRAY['Engineering','Computer Science','Mathematics','Physics'],
    '₦200,000 per annum',
    '2026-07-31',
    'https://mtnfoundation.org/scholarship'
),
(
    'Shell Nigeria University Scholarship',
    'Shell Nigeria',
    'Merit-based scholarship for top students in engineering and geosciences disciplines.',
    'Nigerian citizen, minimum 2nd Class Upper (3.5/5.0 CGPA), studying Petroleum, Chemical, Mechanical or Electrical Engineering.',
    3.50,
    ARRAY['Petroleum Engineering','Chemical Engineering','Mechanical Engineering','Electrical Engineering'],
    '₦500,000 per annum',
    '2026-06-30',
    'https://shell.com.ng/scholarship'
),
(
    'NLNG National Postgraduate Scholarship',
    'Nigeria LNG Limited',
    'Full scholarship for first-class graduates proceeding to postgraduate studies in Nigeria.',
    'First class or distinction, Nigerian, proceeding to Masters or PhD at a Nigerian university.',
    4.50,
    ARRAY['Engineering','Sciences','Social Sciences','Law','Medicine'],
    '₦2,000,000 per annum',
    '2026-09-15',
    'https://nlng.com/scholarships'
),
(
    'TETFUND Academic Staff Development',
    'TETFund',
    'Supports academic development of staff at Nigerian tertiary institutions.',
    'Academic staff at federal or state tertiary institution, sponsored by institution.',
    NULL,
    ARRAY['All disciplines'],
    'Full tuition + stipend',
    '2026-08-01',
    'https://tetfund.gov.ng'
);
