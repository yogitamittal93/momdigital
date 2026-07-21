-- MomDigital Analytics Migration
-- Generated: 2026-07-21
-- Scope: additive only — two changes:
--   1. Add ragSource column to chat_messages
--   2. Create analytics_events table
-- No columns are dropped, renamed, or altered. Zero data loss risk.

-- ── 1. Add ragSource to chat_messages ─────────────────────────────────────────
-- Nullable TEXT. Null for pre-feature rows and for role='user' rows.
-- Populated by the NestJS chatbot service for role='assistant' rows only.
-- Values: 'chromadb' | 'chromadb+web' | 'ddg_fallback' | 'none'
ALTER TABLE "chat_messages" ADD COLUMN "ragSource" TEXT;

-- ── 2. Create analytics_events table ──────────────────────────────────────────
-- Pseudonymous event log (userId = UUID, not email/name).
-- Message content is NEVER stored here — only event type + metadata JSON.
CREATE TABLE "analytics_events" (
    "id"        TEXT        NOT NULL,
    "userId"    TEXT,
    "eventName" TEXT        NOT NULL,
    "metadata"  JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_userId_idx"    ON "analytics_events"("userId");
CREATE INDEX "analytics_events_eventName_idx" ON "analytics_events"("eventName");
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");
