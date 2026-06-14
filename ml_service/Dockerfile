# ml_service/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# System deps: curl for healthcheck, build tools for native packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first for layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Install gunicorn for production serving (NOT Flask dev server)
RUN pip install --no-cache-dir gunicorn

# Copy application source
COPY . .

# Non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 5000

# 2 workers is safe for a CPU-bound RAG/ML service on a single container.
# Increase to 4 if you have >=4 vCPUs on the host.
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5000", "--timeout", "120", "main:app"]