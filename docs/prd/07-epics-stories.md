# 7. Epics and Stories

## Epic 1: Backend Decoupling and Reliability Foundation
**Epic Goal**: Decouple domain logic from Next.js, unify AI access, and establish reliability/observability baselines.

### Story 1.1 Backend Service Skeleton (NestJS)
- As a developer, I want a NestJS service with modules for `auth (stub)`, `ideas`, `plans`, `pieces`, and `ai`, so that domain logic is centralized and testable.
- Acceptance Criteria
  1: Repo bootstrapped with Nest, env config, health and metrics endpoints
  2: OpenAPI scaffold published to `docs/api/openapi.yaml`
  3: CI builds container, runs lint/typecheck
- Integration Verification
  IV1: Next app unaffected; dev and build still pass
  IV2: Health/metrics reachable and return expected schema
  IV3: No secrets logged; env validation enforced

### Story 1.2 AI Integration Unification
- As a developer, I want a single AI client abstraction with consistent request/response schema and streaming where applicable.
- Acceptance Criteria
  1: Replace hardcoded key; env-only secrets
  2: Unified response envelope `{id,type,content,metadata,timestamp}`
  3: Streaming supported for long generations
- Integration Verification
  IV1: All AI routes return consistent shapes
  IV2: Backoff/retry and circuit breaker added; tests simulate provider errors
  IV3: Latency and error metrics captured

### Story 1.3 Rate Limiting and Validation
- As an operator, I want rate limits and input validation to prevent abuse and reduce errors.
- Acceptance Criteria
  1: Per-user/IP limits on AI and write endpoints
  2: Zod/DTO validation on payloads with helpful errors
  3: Error envelope standardized across routes
- Integration Verification
  IV1: Limits enforced; 429 behavior consistent
  IV2: Invalid payloads rejected with 400 + details
  IV3: Logs show structured entries with correlation ids

### Story 1.4 Observability Baseline
- As an operator, I need structured logs, basic metrics, and error reporting.
- Acceptance Criteria
  1: Request/response logs (redacted), latency and error rate metrics
  2: `/healthz` and `/metrics` endpoints operational
  3: Error reporting sink configured (stub or provider)
- Integration Verification
  IV1: Metrics visible; thresholds documented
  IV2: Errors sampled and verified in sink
  IV3: No PII or secrets in logs

### Story 1.5 Migrate Ideas to Service
- As a user, I want ideas endpoints to run on the service without breaking the UI.
- Acceptance Criteria
  1: `GET/POST/DELETE /v1/ideas` live with ownership checks
  2: Next routes proxy or are retired; UI unchanged
  3: Pagination and search implemented
- Integration Verification
  IV1: UI lists, searches, deletes ideas as before
  IV2: AuthZ verified with test users
  IV3: Latency p95 < 300 ms maintained

### Story 1.6 Migrate Plans and Sections
- As a user, I can manage plans and sections with consistency.
- Acceptance Criteria
  1: `GET/POST /v1/plans`, `PATCH /v1/plans/{id}`; sections CRUD + reorder
  2: Attach plan to idea; consistent DTOs
  3: Plan-chat calls unified AI client
- Integration Verification
  IV1: UI flows unchanged; regression on plan screens
  IV2: Section reorder stable; no data loss
  IV3: AI prompts recorded with metadata policy

### Story 1.7 Calendar Generation Endpoint
- As a user, I can generate and edit calendars reliably.
- Acceptance Criteria
  1: `POST /v1/calendar/generate` with constraints; streaming or chunk responses
  2: Persist schedules and support regeneration
  3: Limits and timeouts applied
- Integration Verification
  IV1: UI calendar flow remains intact
  IV2: Long generations stream; no UI lockups
  IV3: Timeout behavior graceful

