# api/Dockerfile
# Multi-stage build — keeps the final image lean (~200MB vs ~600MB single-stage)
# Note: This is part of an npm workspace monorepo. The root package-lock.json
# is not available when the build context is api/ — so we use npm install.

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first so Docker cache is reused when only source changes
COPY package*.json ./
RUN npm install

# Copy source and generate Prisma client for the Linux target
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Prisma's query engine (v5.22.0) is built against OpenSSL 1.1.x (libssl.so.1.1).
# node:22-alpine ships OpenSSL 3.x only, so without this the engine binary
# fails to load and the process crashes before it can bind a port.
RUN apk add --no-cache openssl1.1-compat

# Only install production dependencies in the final image
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output and Prisma artefacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Correct port — NestJS listens on 3001 (matches compose + config.validation.ts)
EXPOSE 3001

# Production start — NOT start:dev
CMD ["node", "dist/src/main.js"]
