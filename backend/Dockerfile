# PathSync AI — Dockerfile
# Build: docker build -t pathsync-ai .
# Run:   docker run -p 8000:8000 --env-file .env pathsync-ai

FROM python:3.12-slim

# System dependencies for pdfplumber, spaCy, and asyncpg
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy NER model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Start with Gunicorn + Uvicorn workers for production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
