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

# Non-root user. --home /tmp gives appuser a writable home dir — without it,
# adduser --system leaves HOME unset/unwritable, which breaks libraries
# (HF/transformers, matplotlib, etc.) that try to write caches under ~/.cache.
RUN addgroup --system appgroup && adduser --system --home /tmp --ingroup appgroup appuser
USER appuser

# No EXPOSE for a fixed port — Railway assigns $PORT dynamically at runtime,
# so the container must bind to whatever it's given, not a hardcoded value.

# 1 worker — Railway's default memory allocation OOM-kills a 2-worker config
# before either worker can finish loading the ML/embedding stack and serve
# a request. Bind to $PORT (Railway's healthcheck hits $PORT, not 5000).
CMD ["sh", "-c", "gunicorn --workers 1 --bind 0.0.0.0:${PORT:-5000} --timeout 120 main:app"]
