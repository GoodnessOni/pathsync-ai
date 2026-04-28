# PathSync AI — Slim Dockerfile for Render free tier
# Target: under 2GB image size

FROM python:3.12-slim

# Minimal system dependencies only
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download smallest spaCy model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
