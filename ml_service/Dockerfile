# ml_service/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# System deps: curl for healthcheck, build tools for native packages
# gosu lets the entrypoint drop from root → appuser after fixing volume ownership
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    gosu \
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

# /app was copied in as root — fix ownership for all static files at build time.
RUN chown -R appuser:appgroup /app

# Stay as ROOT so the entrypoint can fix the Railway volume mount at runtime.
# (Railway mounts volumes as root AFTER the image layers are applied, so the
# build-time chown above has no effect on /app/matrny_db when a volume is
# attached. The entrypoint below fixes ownership then drops to appuser via gosu.)

# No EXPOSE — Railway assigns $PORT dynamically at runtime.

# Entrypoint runs as root:
#   1. mkdir -p /app/matrny_db  — creates the mount point if not yet mounted
#   2. chown it to appuser      — fixes Railway volume ownership at runtime
#   3. exec gosu appuser …      — drops privileges and launches gunicorn
#
# 1 worker — Railway's default memory allocation OOM-kills a 2-worker config.
CMD ["sh", "-c", \
    "mkdir -p /app/matrny_db && chown appuser:appgroup /app/matrny_db && \
    exec gosu appuser gunicorn --workers 1 --bind 0.0.0.0:${PORT:-5000} --timeout 120 main:app"]
