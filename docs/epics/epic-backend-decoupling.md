# Epic: Backend Decoupling and Reliability Foundation

Status: Proposed
Source: docs/prd.md (v0.1 Draft)

## Goal
Decouple domain logic from the Next.js app into a service layer, unify AI integrations under a single client abstraction, and establish core reliability (validation, rate limiting, retries) and observability (logging/metrics/health) baselines without breaking existing user flows.

## Background
Current app (Next.js 14 + Supabase) includes API routes for ideas, plans (sections/reorder), pieces, and AI endpoints. Gaps: hardcoded AI key, TS errors ignored in builds, uneven error handling, limited observability, no rate limiting. PRD defines targets for security, reliability, and performance, and recommends a NestJS service (FastAPI optional for AI pipelines) using a strangle pattern.

## Scope
- Introduce a containerized backend service (NestJS preferred) with modules: auth (stub), ideas, plans (+sections), pieces, ai.
- Define versioned REST endpoints (/v1) and DTO validation; generate OpenAPI.
- Unify AI access with a common response schema and streaming support.
- Add request validation, rate limiting, retries, and structured logs/metrics.
- Incrementally migrate domains: ideas → plans → calendar while keeping UI behavior intact.

## Out of Scope (for this epic)
- Multi-tenant org features, advanced RBAC/approvals
- Third‑party publishing integrations and calendar sync
- Mobile apps, real‑time collaboration

## Non‑Functional Targets
- Non‑AI p95 < 300 ms; AI first byte < 1500 ms with streaming for long outputs
- 99.9% non‑AI, 99% AI endpoints (provider dependent)
- No hardcoded secrets; env‑only configuration with rotation procedures
- Logging with correlation IDs; health/metrics endpoints

## Dependencies
- Supabase (auth, Postgres, storage)
- Hosting for service (Render/Fly/Railway or similar) and CI/CD
- Env/secret management for AI providers

## Risks & Mitigations
- Key exposure and abuse → move to env, rotate compromised keys, restrict scope
- Reliability regressions during migration → strangle pattern, proxy/feature flags, stepwise rollout
- Provider instability/cost → retries with backoff, circuit breaker, budget monitoring

## Milestones
- M1: Service skeleton + OpenAPI + health/metrics
- M2: AI client unification + secure configuration
- M3: Validation + rate limiting + standardized errors
- M4: Ideas domain migrated
- M5: Plans + sections migrated; calendar endpoint added

## Story List (sequenced)
1. Backend Service Skeleton (NestJS)
   - Repo scaffold; env validation; /healthz and /metrics; OpenAPI spec at docs/api/openapi.yaml; CI build/typecheck
2. AI Integration Unification
   - Remove hardcoded key; env‑only secrets; common response schema; streaming support
3. Rate Limiting and Validation
   - Per‑user/IP limits on AI and write endpoints; DTO/Zod validation; standardized error envelope
4. Observability Baseline
   - Structured, redacted logs; latency/error metrics; error reporting sink
5. Migrate Ideas to Service
   - /v1/ideas CRUD + search with ownership checks; Next routes proxy/retire; UI unchanged
6. Migrate Plans and Sections
   - /v1/plans CRUD; sections CRUD + reorder; plan‑chat uses unified AI client
7. Calendar Generation Endpoint
   - /v1/calendar/generate (constraints, streaming/chunks); persist schedules; limits/timeouts

## Acceptance Criteria (Epic)
- All seven stories implemented and verified without breaking existing UI flows
- Secrets managed via environment; no hardcoded keys remain
- Observability in place (logs/metrics/health) and reliability controls active (limits/retries)
- OpenAPI published and shared with the team

## Rollout
- Feature‑flagged migration by domain; fallback to Next routes if the service degrades
- Smoke tests for auth → ideas → plan → calendar; SLO checks post‑deploy

---
Links: docs/prd.md, docs/brief.md
