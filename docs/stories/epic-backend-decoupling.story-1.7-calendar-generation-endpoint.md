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
| 2025-11-17 | v0.3    | Added SSE keep-alives/done meta and calendar persistence endpoints. | James |

---

## Dev Agent Record
### Summary
- Added SSE keep-alives and final `done` summary metadata for `/v1/ai/calendar`, including timeout summaries while keeping concurrency/timeouts intact in `ireal-service/src/ai/ai.service.ts`.
- Implemented calendar edit persistence and retrieval (`POST /v1/ai/calendar/save`, `GET /v1/ai/calendar/{calendarId}`) plus Next.js proxies and OpenAPI/architecture updates for the new contract.
- Strengthened DTO coverage and tests around calendar persistence to align with QA findings; lint/tests are clean.

### Completion Notes
- Added heartbeat + meta.done summary emission and timeout summary path to SSE calendar stream.
- Persist manual calendar edits via Supabase (save + load endpoints) and proxied them through Next.js with legacy fallbacks.
- Updated OpenAPI/architecture docs and unit tests for the new calendar flows.

### Debug Log
- `npm run lint --prefix ireal-service`
- `npm run test --prefix ireal-service`

### File List
- `docs/api/openapi.yaml`
- `docs/architecture/06-api-design.md`
- `docs/stories/epic-backend-decoupling.story-1.7-calendar-generation-endpoint.md`
- `docs/qa/gates/epic-backend-decoupling.1.7-calendar-generation-endpoint.yml`
- `ireal-service/src/ai/ai.controller.ts`
- `ireal-service/src/ai/ai.service.spec.ts`
- `ireal-service/src/ai/ai.service.ts`
- `ireal-service/src/ai/dto/calendar.dto.ts`
- `ireal_demo/app/api/ai/calendar/route.ts`
- `ireal_demo/app/api/ai/calendar/save/route.ts`
- `ireal_demo/app/api/ai/calendar/[calendarId]/route.ts`


## QA Results

### Review Date: 2025-11-03

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Deep review triggered (>5 AC). Streaming payload emits data/done events only—no heartbeats/keep-alives or `meta.done` sentinel, so clients can hang and AC2’s “final frame with meta.done=true + heartbeats” is unmet (ireal-service/src/ai/ai.service.ts:755, ireal-service/src/ai/ai.service.ts:777).
- Timeout/long-run path writes an `error` event and ends without streaming partial results or summary metadata; AC4 requests graceful partial delivery with status `timeout` but current flow just aborts (ireal-service/src/ai/ai.service.ts:601, ireal-service/src/ai/ai.service.ts:636).
- Calendar persistence/edit surface is missing: only POST `/v1/ai/calendar` is exposed and the Next.js proxy mirrors that single route, so manual edits/diffs cannot be saved or replayed per AC3/AC5 (docs/api/openapi.yaml:328, ireal_demo/app/api/ai/calendar/route.ts:3).

### Acceptance Criteria Validation
- AC2: FAIL — SSE lacks heartbeat keep-alives and final `meta.done=true` frame; only data/done events are emitted.
- AC3: FAIL — No API to persist manual edits; runs/entries insert happens only on generation, so edited calendars cannot be stored or diffed.
- AC4: FAIL — Timeout path sends error and exits without partial stream or summary status.
- AC5: FAIL — Next.js proxy handles only generation; no diff/edit proxying behind `CALENDAR_SERVICE_ENABLED`.
- AC6: CONCERNS — OpenAPI documents streaming shape but omits heartbeat/done semantics and edit/diff operations.

### Test Review
- Reported as run: `npm run lint --prefix ireal-service`, `npm run test --prefix ireal-service`.
- Coverage gaps: `ai.service.spec.ts` exercises normalization/diff only; no streaming, Supabase persistence, or Next.js proxy coverage.

### Risks
- Clients may hang on long-lived connections without heartbeats/final sentinel; user-visible timeouts lack partial data.
- Manual edits cannot persist or survive reloads, undermining core calendar editing workflow and diffs.

### Recommendations
- Add periodic heartbeat writes (e.g., comments or `event: ping`) and emit final summary with `meta.done=true`; document in OpenAPI.
- On timeout/failure, stream available pieces plus a `timeout` summary frame instead of only an error event.
- Provide service + proxy endpoints for saving/updating calendar entries and returning diffs (and document them); include integration tests covering streaming, timeouts, and persistence.

### Gate
- Gate Decision: FAIL — Blocking gaps on AC2/AC3/AC4/AC5.

### Review Date: 2025-11-17

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Heartbeats and final `done` metadata are now emitted in SSE stream; timeout/failure flows also send a summary with status to avoid hangs (ireal-service/src/ai/ai.service.ts:529-621, 877-918).
- Calendar edit persistence and retrieval added with DTO validation and Supabase-backed save/delete/insert workflow; Next.js proxies added with feature-flagged legacy fallbacks (ireal-service/src/ai/ai.controller.ts:70-93, ireal-service/src/ai/ai.service.ts:681-836, ireal_demo/app/api/ai/calendar/save/route.ts:1-61, ireal_demo/app/api/ai/calendar/[calendarId]/route.ts:1-47).
- Contract/docs updated for streaming semantics and new endpoints (docs/api/openapi.yaml:332-383, docs/architecture/06-api-design.md:10-13). Tests extended for persistence paths; lint/tests clean.

### Acceptance Criteria Validation
- AC1: PASS — `/v1/ai/calendar` remains validated/wrapped in envelope.
- AC2: PASS — SSE emits keep-alive comments and final summary with `done` metadata.
- AC3: PASS — Supabase persistence for generated and manual edits; save/load endpoints surface stored entries.
- AC4: PASS — Timeout path returns summary with status; concurrency guard preserved.
- AC5: PASS — Next.js proxies include generate + save/load behind feature flag with legacy fallback.
- AC6: PASS — OpenAPI and architecture shards updated with streaming schema and persistence model.

### Test Review
- `npm run lint --prefix ireal-service`
- `npm run test --prefix ireal-service`
- Unit coverage added for save/load flows; no streaming E2E yet (acceptable).

### Risks
- Minor: No explicit E2E coverage of streaming/heartbeat in Next client, but contract documented; monitor in integration.

### Gate
- Gate Decision: PASS — All ACs satisfied; remaining risk is low and documented.
