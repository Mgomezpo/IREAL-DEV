# IREAL Brownfield Enhancement Architecture

Version: v0.1 (Draft)
Source Inputs: docs/prd.md, docs/brief.md, ireal_demo/*, old_PRDs_&_Docs/*

## 1. Introduction
This document outlines the architectural approach to enhance IREAL by decoupling backend domain logic from the Next.js app, unifying AI integration, and establishing reliability and observability baselines. It complements the existing implementation and PRD, guiding incremental change with minimal disruption.

## 2. Existing Project Analysis
- Primary Purpose: AI‑assisted creative workflow for content creators (ideas → plans → calendar → assets)
- Current Tech Stack: Next.js 14 (App Router), React 19, TS, Tailwind v4, Radix UI; Supabase SSR for auth/session; Google Generative AI via SDK and raw REST
- Architecture Style: Monolith web app with embedded API routes per domain
- Deployment: Likely Vercel for frontend; serverless Next API routes
- Constraints / Issues:
  - Hardcoded AI key in `app/api/ai/generate/route.ts`
  - `next.config.mjs` ignores TypeScript build errors
  - No explicit rate limiting, retries/circuit breaker, or structured telemetry

Validation: Based on the code and docs above, please confirm these observations match your environment.

## 3. Enhancement Scope and Integration Strategy
- Enhancement Type: Backend decoupling and reliability uplift
- Strangler Approach:
  1) Keep Next.js as web + BFF; introduce `ireal-service` (NestJS) as a separate backend
  2) Migrate domains in order: ideas → plans/sections → calendar
  3) Thin proxy in Next during migration; retire routes once clients pivot to the service
- Boundaries and Compatibility:
  - Versioned REST `/v1` on the service with DTO validation
  - Response envelope `{ data, error, meta }`; consistent error codes
  - Preserve current UI behavior and URL structure

## 4. Tech Stack Decisions
- Backend Service: NestJS (TypeScript) for language parity, DI, modules, and OpenAPI generation
  - Alternatives: FastAPI for specialized AI pipelines later; defer to avoid early split
- Data: Supabase Postgres; use service‑role connection or direct PG client/ORM (Kysely/Prisma)
- Messaging (future): BullMQ for async tasks if needed
- Observability: Minimal logger (pino/winston) with correlation IDs; metrics via Prometheus format

## 5. Component Architecture
New component: ireal-service (NestJS)
- Responsibility: Centralize domain logic (ideas, plans, pieces, ai), validation, and reliability controls
- Integration Points:
  - Next.js calls service REST `/v1/*`
  - Supabase auth context forwarded via JWT or session token for ownership checks
- Interfaces:
  - REST endpoints; OpenAPI spec in `docs/api/openapi.yaml`
- Dependencies:
  - Existing: Supabase (auth/db/storage)
  - New: NestJS modules, rate limiter, logger, metrics

Modules inside ireal-service
- auth (stub): validate user context; no credentials storage
- ideas: CRUD/search with ownership/pagination
- plans: CRUD; sections CRUD + reorder; attach plan to idea
- ai: provider abstraction; generate/nudge/plan‑chat/calendar
- pieces: asset metadata management; storage integration via Supabase

## 6. API Design and Integration
- API Strategy: Versioned `/v1` REST; standard envelope and errors; DTO/class‑validator
- Authentication: Forward Supabase user/session context; enforce ownership at service
- Versioning: `/v1` initially; backward‑compatible changes preferred

Representative endpoints
- Ideas: `GET/POST /v1/ideas`, `GET/DELETE /v1/ideas/{id}`
- Plans: `GET/POST /v1/plans`, `PATCH /v1/plans/{id}`, `POST /v1/plans/{id}/sections:reorder`
- AI: `POST /v1/ai/generate`, `POST /v1/ai/plan-chat`, `POST /v1/ai/calendar`
- Health/Metrics: `GET /healthz`, `GET /metrics`

Response envelope
```
{
  "data": { /* payload */ },
  "error": null,
  "meta": { "requestId": "...", "latencyMs": 123 }
}
```

## 7. Data Models and Schema
- Ideas: id, user_id, title, content, created_at, tags
- Plans: id, user_id, idea_id?, title, status, created_at, updated_at
- PlanSections: id, plan_id, order, title, body
- Pieces: id, user_id, plan_id?, type, url, metadata, created_at

Schema integration
- Prefer additive migrations; keep backward compatibility during cut‑over
- Indexes: (user_id, created_at) for lists; (plan_id, order) for sections

## 8. Security and Reliability
- Secrets: No hardcoded keys; env vars + secret manager; server‑only runtime
- Validation: DTOs on all inputs; reject invalid payloads with 400 and details
- Rate Limiting: Per user/IP; strict on AI and write endpoints
- Retries/Circuit Breaker: Jittered backoff for idempotent ops; breaker on AI provider failures
- Logging: Structured with redaction; correlation IDs propagated from Next → service

## 9. Deployment and Operations
- Frontend: Vercel
- Service: Container image deployed to managed platform (Render/Fly/Railway)
- CI/CD: Build, lint, typecheck; publish OpenAPI artifact; tag image
- Config: `.env` per env + secret store; minimal feature flags for migration

## 10. Migration Plan
- Phase 1: Service skeleton, health/metrics, OpenAPI
- Phase 2: AI unification; secure config; standardized responses
- Phase 3: Validation/rate limiting; error envelope
- Phase 4: Ideas domain migration; proxy from Next
- Phase 5: Plans + sections; plan‑chat on unified AI client
- Phase 6: Calendar generation; streaming/timeouts
- Rollback: Toggle proxy to Next routes; maintain DB compatibility

## 11. Risks and Mitigations
- Provider instability/cost → retries, breaker, budgets
- Regressions during migration → strangler pattern, feature flags, smoke tests
- Secret leakage → env‑only keys, rotation procedures, audits

## 12. Source Tree (Proposed)
```
ireal-service/
  src/
    app.module.ts
    common/ (logging, filters, pipes, dtos)
    auth/
    ideas/
    plans/
    ai/
    pieces/
  test/
  docs/api/openapi.yaml
```

Appendix: Please confirm the above assumptions and choices reflect your environment so I can refine DTOs and endpoint contracts next.

