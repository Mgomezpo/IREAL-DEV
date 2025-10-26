# IREAL Brownfield Enhancement PRD

Version: v0.1 (Draft)

This PRD converts the current brief and existing implementation into an actionable, brownfield plan. It emphasizes backend decoupling, unified AI integration, and reliability targets, with early UX/UI guidance where the frontend is incomplete.

## 1. Intro Project Analysis and Context

### Analysis Source
- IDE-based fresh analysis using `docs/brief.md` and the `ireal_demo` codebase

### Current Project State
- App: Next.js 14 (App Router), React 19, TS, Tailwind v4, Radix UI
- Auth/DB: Supabase SSR client (`lib/supabase/*`) with middleware route protection
- Domains and APIs:
  - AI: `/app/api/ai/{generate,plan-chat,plans,calendar,nudge}` (mixed SDK/REST usage)
  - Ideas: `/app/api/ideas/*` (list, search, delete; idea detail)
  - Plans: `/app/api/plans/[id]/*` (sections, reorder, section CRUD)
  - Pieces: `/app/api/pieces/[id]/*` (assets upload/listing)
- UX: Spanish-first, notebook theme, flows for auth, ideas, plans, calendar, biblioteca per old UX docs
- Notable issues: hardcoded AI key in `app/api/ai/generate/route.ts`; TS build errors ignored in `next.config.mjs`; no explicit rate limiting/observability

### Available Documentation
- Project Brief: `docs/brief.md`
- Old UX/flows: `old_PRDs_&_Docs/*` (landing/auth, dashboard, ideas, planes, calendario, UX style guide PDF/MD)
- Source tree and tech stack are implicit from repo; no formal API spec yet

## 2. Enhancement Scope Definition

### Enhancement Type (checked)
- [x] Integration with New Systems (backend service decoupling)
- [x] Performance/Scalability Improvements (reliability, rate limiting, retries)
- [x] Major Feature Modification (AI integration unification + security)
- [ ] UI/UX Overhaul (incremental UX improvements only)

### Objectives (from brief + repo)
- Decouple backend concerns from the Next.js app via a service layer (NestJS preferred, FastAPI optional for AI pipelines)
- Standardize AI integration (one client lib, consistent response schema, streaming support)
- Meet reliability and security targets (SLOs, rate limiting, retries, secrets handling)
- Provide early UX notes for incomplete front-end areas while keeping MVP focused

## 3. Functional Requirements (FRs)

FR-1 Auth & Session
- Protect all non-public routes; session refresh via Supabase or equivalent
- Redirect unauthenticated users to `/auth`; redirect authenticated users away from `/auth` to `/dashboard`

FR-2 Ideas
- Create, read, search, delete ideas; group by recency on UI
- API must validate inputs, paginate, and enforce ownership

FR-3 Plans
- Create plan from idea; manage sections (CRUD, reorder)
- Plan-chat guidance with concise coaching messages; attach/detach plans to ideas

FR-4 Calendar
- AI-assisted calendar generation from goals and cadence inputs
- Persist schedules; allow user edits and regeneration by constraints

FR-5 Pieces (Assets)
- Upload/list assets associated to plans/pieces with metadata and type validation

FR-6 AI Integration
- Provide endpoints for generate, nudge, plan-chat, and calendar with unified schema:
  - `{ id, type, content, metadata: { tokens, model, latencyMs }, timestamp }`
- Support streaming for long responses (where applicable)

FR-7 Backend Decoupling
- Introduce a service layer/API separate from Next app for domain logic and data access
- Define versioned REST endpoints (`/v1`) and DTO validation at the service layer

FR-8 Observability & Admin
- Structured logs (request id, user id hash, route, status, latency)
- Minimal health/metrics endpoints; error reporting channel

## 4. Non-Functional Requirements (NFRs)

NFR-1 Performance
- Non-AI API p95 < 300 ms (P50 < 100 ms)
- AI endpoints: first byte < 1500 ms; stream when response > 512 tokens

NFR-2 Availability & Reliability
- 99.9% for non-AI endpoints; 99% for AI endpoints (provider dependent)
- Retries (idempotent ops) with jittered backoff; circuit breaker on AI provider failures

NFR-3 Security
- No hardcoded secrets; environment-based config and secret manager support
- Input validation with schema (Zod/DTOs) and authZ checks on resource ownership

NFR-4 Scalability
- Stateless service instances; horizontal scaling; queue-ready for future background jobs

NFR-5 Observability
- Request logging, basic tracing identifiers, and metrics (RPS, error rate, latency)

NFR-6 Compliance & Data
- Clear data retention policy for prompts/responses; PII handling and user export/delete

## 5. Architecture and Integration Plan

### Backend Decoupling Strategy
- Approach: Strangle pattern
  1) Keep Next.js as web + BFF for SSR/edge
  2) Introduce `ireal-service` as a separate containerized backend (NestJS recommended for TS synergy)
  3) Migrate domain logic: ideas, plans, pieces, calendar into the service incrementally
  4) Next.js API routes become thin proxies or are retired once clients use service
- Option: Python FastAPI microservice for AI pipelines if Python ecosystem is needed later; start with a single service to reduce complexity

### Technology Choices
- Service: NestJS (TS) with class-validator/class-transformer, OpenAPI; Alt: FastAPI (Python) with Pydantic
- DB: Continue on Supabase Postgres; access via service (pg/Prisma/Kysely) or Supabase client with service role
- Messaging (future): lightweight queue for async tasks (BullMQ/Celery) if needed

### API Contracts
- Versioned endpoints `/v1`; OpenAPI spec generated and stored in `docs/api/openapi.yaml`
- Consistent response envelope `{ data, error, meta }`; error codes standardized

### Security & Config
- Env-only secrets; rotate compromised keys; use server-only runtime
- RBAC groundwork: resource ownership checks per user id
- Rate limiting per user/IP for write and AI endpoints

### Observability
- Logger with request correlation id; redact secrets
- Health: `/healthz`; Metrics: `/metrics` (Prometheus format or minimal JSON)

### Deployment & Operations
- Frontend: Vercel (assumed)
- Service: containerized on managed platform (e.g., Render/Fly/Railway); CI to build and deploy
- Config management: `.env` per environment + secret store; feature flags minimal

## 6. Early UX/UI Notes
- Spanish-first content; calm “notebook” theme; Playfair/Inter typography; consistent accent color (`#8A0F1C`), replace inconsistent `#960018`
- Pages: `/` landing, `/auth`, `/dashboard`, `/ideas`, `/planes/[id]`, `/calendario`, `/biblioteca`
- Interaction patterns: short plan-chat prompts; focus-visible rings; accessible labels; responsive on common breakpoints
- Empty states and loading: skeletons for ideas/plans; gentle transitions; clear error toasts

## 7. Epics and Stories

### Epic 1: Backend Decoupling and Reliability Foundation
**Epic Goal**: Decouple domain logic from Next.js, unify AI access, and establish reliability/observability baselines.

Story 1.1 Backend Service Skeleton (NestJS)
- As a developer, I want a NestJS service with modules for `auth (stub)`, `ideas`, `plans`, `pieces`, and `ai`, so that domain logic is centralized and testable.
- Acceptance Criteria
  1: Repo bootstrapped with Nest, env config, health and metrics endpoints
  2: OpenAPI scaffold published to `docs/api/openapi.yaml`
  3: CI builds container, runs lint/typecheck
- Integration Verification
  IV1: Next app unaffected; dev and build still pass
  IV2: Health/metrics reachable and return expected schema
  IV3: No secrets logged; env validation enforced

Story 1.2 AI Integration Unification
- As a developer, I want a single AI client abstraction with consistent request/response schema and streaming where applicable.
- Acceptance Criteria
  1: Replace hardcoded key; env-only secrets
  2: Unified response envelope `{id,type,content,metadata,timestamp}`
  3: Streaming supported for long generations
- Integration Verification
  IV1: All AI routes return consistent shapes
  IV2: Backoff/retry and circuit breaker added; tests simulate provider errors
  IV3: Latency and error metrics captured

Story 1.3 Rate Limiting and Validation
- As an operator, I want rate limits and input validation to prevent abuse and reduce errors.
- Acceptance Criteria
  1: Per-user/IP limits on AI and write endpoints
  2: Zod/DTO validation on payloads with helpful errors
  3: Error envelope standardized across routes
- Integration Verification
  IV1: Limits enforced; 429 behavior consistent
  IV2: Invalid payloads rejected with 400 + details
  IV3: Logs show structured entries with correlation ids

Story 1.4 Observability Baseline
- As an operator, I need structured logs, basic metrics, and error reporting.
- Acceptance Criteria
  1: Request/response logs (redacted), latency and error rate metrics
  2: `/healthz` and `/metrics` endpoints operational
  3: Error reporting sink configured (stub or provider)
- Integration Verification
  IV1: Metrics visible; thresholds documented
  IV2: Errors sampled and verified in sink
  IV3: No PII or secrets in logs

Story 1.5 Migrate Ideas to Service
- As a user, I want ideas endpoints to run on the service without breaking the UI.
- Acceptance Criteria
  1: `GET/POST/DELETE /v1/ideas` live with ownership checks
  2: Next routes proxy or are retired; UI unchanged
  3: Pagination and search implemented
- Integration Verification
  IV1: UI lists, searches, deletes ideas as before
  IV2: AuthZ verified with test users
  IV3: Latency p95 < 300 ms maintained

Story 1.6 Migrate Plans and Sections
- As a user, I can manage plans and sections with consistency.
- Acceptance Criteria
  1: `GET/POST /v1/plans`, `PATCH /v1/plans/{id}`; sections CRUD + reorder
  2: Attach plan to idea; consistent DTOs
  3: Plan-chat calls unified AI client
- Integration Verification
  IV1: UI flows unchanged; regression on plan screens
  IV2: Section reorder stable; no data loss
  IV3: AI prompts recorded with metadata policy

Story 1.7 Calendar Generation Endpoint
- As a user, I can generate and edit calendars reliably.
- Acceptance Criteria
  1: `POST /v1/calendar/generate` with constraints; streaming or chunk responses
  2: Persist schedules and support regeneration
  3: Limits and timeouts applied
- Integration Verification
  IV1: UI calendar flow remains intact
  IV2: Long generations stream; no UI lockups
  IV3: Timeout behavior graceful

### Epic 2: UX Consistency and Frontend Gaps (Early Notes)
**Epic Goal**: Address visual consistency and missing states without major overhaul.

Story 2.1 Color and Typography Consistency
- Acceptance Criteria: Accent tokens unified; focus-visible implemented; headings with Playfair; body Inter

Story 2.2 Empty/Loading/Error States
- Acceptance Criteria: Empty states for ideas/plans; skeletons; error toasts standardized

Story 2.3 Localization and Copy Review
- Acceptance Criteria: Spanish copy review; avoid jargon; consistent button labels

## 8. Acceptance and Rollout
- Staged rollout by feature flags; revert to Next routes if service degraded
- Smoke tests for critical flows (auth → idea → plan → calendar)
- Post-deploy SLO checks; alerting thresholds documented

## 9. Open Questions
- Day-1 external integrations for publishing and calendars?
- Where to host the service (constraints, budget)?
- Team preferences: NestJS vs FastAPI split for AI?
- Data retention policy specifics for AI prompts and outputs?

---
References: `docs/brief.md`, `ireal_demo/*`, `old_PRDs_&_Docs/*`
