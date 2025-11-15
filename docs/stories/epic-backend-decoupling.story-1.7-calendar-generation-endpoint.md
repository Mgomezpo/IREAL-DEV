# Story 1.7 - Calendar Generation Endpoint

Status: Ready for Review
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a user,
I can generate and edit content calendars reliably,
so that I can plan my publishing cadence with AI help.

## Acceptance Criteria
1. Expose `POST /v1/ai/calendar` (service module) that reuses the unified AI client, validates payload `{ channels: string[], cadence: "daily"|"weekly"|"monthly", start: string, end: string, constraints?: object, calendarId?: string }`, and returns the standard `{ data, error, meta }` envelope.
2. Support long-running generations via streaming (SSE or chunked responses): emit partial calendar entries incrementally, include heartbeat keep-alives, and send a final frame with `meta.done=true` plus summary metadata.
3. Persist calendar runs and entries to Supabase with additive tables, version each run, and when `calendarId` is provided return a diff payload (`added`, `updated`, `removed`) alongside streamed results; manual edits must persist and survive reloads.
4. Enforce a 30s generation timeout and per-user concurrency (max one active generation); gracefully terminate by streaming partial results, marking run status `timeout`, and logging metrics (`latencyMs`, `tokens`, `calendarId`).
5. Update Next.js API routes (behind `CALENDAR_SERVICE_ENABLED`) to proxy generation, diff, and edit operations to the service while keeping the existing calendar UI flow and edit/save behaviors intact.
6. Document the updated contract in `docs/api/openapi.yaml` and architecture shards, including streaming response schema and persistence model.

## Integration Verification
IV1. Calendar UI generates schedules via streaming without UI lock; manual edits persist after reload and across feature-flag toggles.
IV2. Regeneration with prior `calendarId` returns diffs and does not duplicate entries; users can accept updates without losing edits.
IV3. Timeout and concurrency limits surface friendly messaging, deliver partial results, and capture metrics/log entries.
IV4. Next.js proxies fall back cleanly when `CALENDAR_SERVICE_ENABLED` is false, preserving legacy behavior.

## Dependencies
- Stories 1.1-1.6 completed (service skeleton, AI client, rate limiting, observability, ideas, and plans).
- Updated OpenAPI spec (`docs/api/openapi.yaml`) and architecture shards (`docs/architecture/06-api-design.md`, `03-enhancement-scope.md`).
- Supabase migrations and feature flag conventions introduced in Stories 1.5 and 1.6.

## Tasks / Subtasks
- [x] Implement NestJS calendar module with `POST /v1/ai/calendar` handler, DTO validation, and envelope response (AC1).
  - [x] Allow optional `calendarId` to trigger regeneration diff logic (AC1, AC3).
- [x] Integrate streaming support (SSE/chunked) emitting incremental entries and final sentinel metadata (AC2).
- [x] Add Supabase migrations for calendar runs and entries; persist generated schedules and manual edits (AC3).
- [x] Build diff computation returning `added`, `updated`, `removed` collections when regenerating (AC3).
- [x] Wire timeout + concurrency guard leveraging rate limiter utilities from Story 1.3 (AC4).
- [x] Extend metrics/logging to capture generation status, latency, and tokens (AC4).
- [x] Update Next.js `/api/calendar/*` routes (or equivalents) to proxy to the service behind `CALENDAR_SERVICE_ENABLED` and maintain UI editing flow (AC5, IV1).
- [x] Refresh OpenAPI spec and architecture documentation with new endpoints, payloads, and streaming schema (AC6).

## Dev Notes
- Follow the `/v1/ai/*` pattern defined in architecture for AI endpoints, reusing the unified `AiService` introduced in Story 1.2 (docs/architecture/06-api-design.md).
- Streaming should mirror the approach used in existing AI flows; prefer Nest `@Sse()` with heartbeat keep-alives so the Next.js client can append events progressively (docs/prd/06-ux-ui-notes.md).
- Store calendar runs and entries in additive Supabase tables; ensure migrations are backward compatible and reference plan IDs when available (docs/architecture/03-enhancement-scope.md, 07-data-models.md).
- Respect rate limiting, logging, and circuit-breaker standards from Stories 1.3 and 1.4 when integrating timeouts and retries (docs/architecture/08-security-reliability.md).
- Wrap Next.js proxies with the existing feature flag pattern (`*_SERVICE_ENABLED`) so operators can toggle rollout without redeploying clients.
- Update `docs/api/openapi.yaml` with streaming response schema and diff structure; keep documentation in sync with Dev Notes to avoid drift.

### Testing
- Unit tests for calendar generation service, diff computation, and timeout paths.
- Integration tests (Nest + Supabase) covering persistence of generated entries and regeneration diffs.
- Contract tests for streaming endpoint ensuring final sentinel frame and schema compatibility with Next client.
- End-to-end tests (Next + service) toggling `CALENDAR_SERVICE_ENABLED` to verify UI edits and regeneration survive refreshes.
- Load/latency checks to confirm 30s timeout and concurrency guard behave under stress.

## Change Log
| Date       | Version | Description                                      | Author     |
|------------|---------|--------------------------------------------------|------------|
| 2025-11-02 | v0.2    | Expanded acceptance criteria, tasks, and notes.  | Sarah (PO) |

---

## Dev Agent Record
### Summary
- Added normalized calendar generation pipeline with SSE chunking, concurrency guard, and Supabase-backed run history/diff tracking in `ireal-service/src/ai/ai.service.ts`.
- Expanded DTOs, validators, and module wiring for calendar requests plus updated metrics/documentation artifacts (`docs/api/openapi.yaml`, `docs/architecture/*`, `docs/dev-quickstart.md`).
- Feature-flagged Next.js proxy with legacy fallback streaming and Supabase migrations/permissions for `calendar_runs` and `calendar_entries`.

### Tests
- `npm run lint --prefix ireal-service`
- `npm run test --prefix ireal-service`

### File List
- `docs/api/openapi.yaml`
- `docs/architecture/03-enhancement-scope.md`
- `docs/architecture/06-api-design.md`
- `docs/architecture/07-data-models.md`
- `docs/dev-quickstart.md`
- `docs/stories/epic-backend-decoupling.story-1.6-migrate-plans-and-sections.md`
- `docs/stories/epic-backend-decoupling.story-1.7-calendar-generation-endpoint.md`
- `ireal-service/src/ai/ai.controller.ts`
- `ireal-service/src/ai/ai.module.ts`
- `ireal-service/src/ai/ai.service.spec.ts`
- `ireal-service/src/ai/ai.service.ts`
- `ireal-service/src/ai/dto/calendar.dto.ts`
- `ireal-service/src/common/supabase/supabase.types.ts`
- `ireal_demo/app/api/ai/calendar/route.ts`
- `ireal_demo/scripts/002_enable_rls.sql`
- `ireal_demo/scripts/004_calendar_tables.sql`
