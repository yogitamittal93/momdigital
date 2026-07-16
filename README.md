# MomDigital (Matrny)

**AI-powered maternal health platform for Indian mothers** — pregnancy, postpartum recovery, childcare, and nutrition guidance, grounded in a RAG pipeline over 25,000+ curated medical and Ayurvedic knowledge chunks.

Built and shipped solo — architecture, backend, RAG pipeline, frontend, deployment, and DevOps.

🔗 [Live app](https://momdigital.live) · Built with NestJS · Next.js · Python/Flask · PostgreSQL · ChromaDB · Groq

---

## What it does

MomDigital's core feature is **Matrny**, an AI chatbot that answers maternal-health questions by retrieving from a curated knowledge base — FOGSI clinical guidelines, WHO/ICMR/NHM guidance, NFHS-5 data, and classical Ayurvedic texts (Charaka Samhita, Ashtanga Hridayam, and others) — rather than generating answers from an LLM's unguided memory. It's built for the Indian context: Hinglish input, home remedies, and Ayurvedic wisdom layered alongside modern clinical evidence.

Beyond the chatbot, the platform includes pregnancy/postpartum tracking, a nanny/caregiver trust-verification system, a doctor escalation queue for questions requiring human review, community features, and a career-continuity planner for maternity breaks.

## Why it's technically interesting

- **Production RAG pipeline**, not a demo — triple-vector search, hallucination detection, confidence-tiered routing to human doctors, and a doctor-verified answer cache.
- **Polyglot microservices** — NestJS for the API, Python/Flask for ML, Next.js for the frontend — each doing what it's best at, deployable and scalable independently.
- **Compliance-aware by design** — built around India's Telemedicine Practice Guidelines 2020, with immutable PII access logging and no unsupervised drug-dosage guidance.
- **Cost-conscious infra choices** — Groq over OpenAI for inference speed/cost, ChromaDB + Hugging Face Hub for the vector store instead of a paid managed vector DB.

---

## Architecture

```
Next.js Web App / Capacitor Mobile
          │  HTTP (REST + HttpOnly Cookie Auth)
          ▼
   NestJS API (TypeScript)  ──────────►  PostgreSQL (via Prisma)
          │  Internal HTTP
          ▼
   Python Flask ML Service  ──────────►  ChromaDB (vector store)
                                                │
                                                ▼
                                   Hugging Face Hub (model + DB store)
```

Three services, each chosen deliberately:

| Service | Role | Why |
|---|---|---|
| **NestJS API** | Auth, business logic, 23 domain modules, DB access | Structured TypeScript, DI, decorators, built-in rate limiting |
| **Python/Flask ML service** | RAG pipeline, embeddings, NLP | Owns the ML ecosystem (Hugging Face, ChromaDB, sentence-transformers) that Node lacks |
| **Next.js frontend** | Web + mobile (via Capacitor) | SSR for marketing/SEO, static export for the mobile WebView shell |

Services fail and scale independently — the ML service can restart without taking down auth.

---

## The RAG pipeline

1. **Product/ingredient detection** — flags product-specific questions (e.g. "Is Janam Gutti safe?") and extracts ingredients via LLM before retrieval.
2. **Embed the question** — `all-MiniLM-L6-v2` (Hugging Face sentence-transformer) converts the query into a 384-dim vector.
3. **Triple vector search** — three parallel ChromaDB queries: broad (top 8), Ayurvedic-only (top 4), modern-medical-only (top 4) — ensuring every answer blends traditional and clinical sources.
4. **Merge, dedupe, rank** by cosine distance; keep the top 10–12 chunks.
5. **3-stage web search fallback** for real-time or branded-product questions: DuckDuckGo → Indian parenting sites → PubMed via NCBI E-utilities.
6. **Prompt assembly** — user profile (pregnancy week, conditions, mood score), retrieved chunks, live web results, and recent conversation history.
7. **LLM call** — Groq running Llama 3.3 70B at temp 0.45. The LLM never has open internet access; all grounding comes from retrieval.
8. **Hallucination check** — regex-flags invented dosages/percentages and verifies they exist in the retrieved source text before returning an answer; unverified answers are discarded in favor of a safe fallback.
9. **Confidence tiering** — `auto_safe` / `ai_generated` / `requires_doctor`, with the last tier routed to a human-doctor review queue.

## The doctor escalation system

Questions tagged `requires_doctor` create a `ContentRequest` and are assigned to an MBBS-registered doctor via a review dashboard. Approved answers are cached (hashed by question) so identical future questions skip the LLM pipeline entirely — this is the compliance backbone under India's Telemedicine Practice Guidelines 2020.

---

## Tech stack

**Backend:** NestJS, Prisma ORM, PostgreSQL, Redis (session/profile caching), Passport (Google/GitHub OAuth), JWT (dual-token: 15-min access / 7-day refresh, HttpOnly cookies only — no localStorage)

**ML/AI:** Python, Flask, ChromaDB, Groq (Llama 3.3 70B), sentence-transformers, spaCy (NER for auto-extracting user profile data from natural conversation), LangChain (chunking)

**Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI, react-hook-form + zod, Capacitor (Android/iOS shell)

**Infra:** Docker (multi-stage builds), GitHub Actions CI/CD, Railway (3 independently deployed services), Hugging Face Hub (vector DB hosting — avoids paid persistent volumes)

**Testing:** Jest (unit), Playwright (E2E — including explicit HttpOnly cookie contract tests), pytest (ML service)

---

## Key engineering decisions

| Decision | Why |
|---|---|
| Groq over OpenAI | 5–10x faster inference, lower cost, comparable quality at this scale |
| ChromaDB + HF Hub over Pinecone | Self-hosted, no per-query API cost, versioned dataset hosting solves Railway's lack of cheap persistent volumes |
| HttpOnly cookies over localStorage | Eliminates XSS token theft — JS cannot read the auth token |
| Dual JWT tokens | Short-lived access token limits exposure; DB-backed refresh tokens allow instant session revocation |
| Capacitor over React Native | One codebase for web + iOS + Android, no new language, cookie auth works identically across platforms |
| Doctor Queue + hallucination check | Medical-safety-first design — the system is built to fail safe, not to sound confident |

---

## Status

Live in production at [momdigital.live](https://momdigital.live). Actively developed — Android app packaging in progress via the existing Capacitor setup.