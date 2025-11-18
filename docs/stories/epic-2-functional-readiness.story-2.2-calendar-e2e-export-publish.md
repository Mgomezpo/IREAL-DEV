# Story 2.2 - Calendar E2E Export/Publish

Status: Ready for Review  
Epic: docs/epics/epic-2-functional-readiness.md
Priority: P1  
Owner: Backend/AI

## Story
As a user,
I want to export or publish generated calendars end-to-end,
so that even a rough UI lets me push schedules (or downloads) reliably.

## Acceptance Criteria
1. Provide export endpoints `/v1/ai/calendar/export` (JSON, CSV) including channel, dates, and status metadata; feature-flagged and documented; CSV column order defined.
2. Add publish endpoint (`POST /v1/ai/publish`) that accepts calendarId/runId and publishes (dry-run acceptable) entries with per-entry status captured (success/fail with reason).
3. Preserve diffs/edits: publish/export uses the latest persisted entries (including manual edits), not just the last generation payload.
4. SSE streaming stays compatible: publish/export endpoints do not regress calendar generation or diff/apply flows.

## Integration Verification
IV1. Export returns data for TikTok/Instagram entries with correct schema (JSON + CSV order) and envelope metadata; unsupported channels are excluded or flagged with error detail.  
IV2. Publish returns per-entry statuses and records outcomes; retries on transient failures are logged/flagged; missing auth returns clear 4xx.  
IV3. After manual edit and regeneration, publish/export uses the stored (edited) set, not a stale run.

## Dependencies
- Story 2.1 channel plumbing and persistence of publish intents.
- Supabase calendar entries/runs already in place (Epic 1).

## Tasks / Subtasks
- [x] Implement export (JSON/CSV) endpoints and add to proxies with flags.
- [x] Implement publish endpoint using adapters (dry-run acceptable) that writes per-entry status.
- [x] Ensure publish/export read from latest persisted entries (including manual saves).
- [x] Update OpenAPI/architecture docs for export/publish schemas and flags.
- [x] Add tests for export schema and publish status recording.
- [x] Ensure responses include per-entry status and requestId/channel metadata in envelope.
- [x] Keep legacy/dry-run deterministic when flags are off; document behavior.
- [x] Define CSV column order (e.g., `title,channel,format,copy,script,targetAudience,date,time,hashtags,status`) and validate.
- [x] Specify error codes/messages for unsupported channel and missing/invalid channel auth.

## Testing
- Unit tests for export formatting and publish status handling.
- Integration test: edit calendar → save → publish/export → verify saved entries used.
- Negative test: publish with stale run vs saved edits; unsupported channel; missing auth.

## QA Results

### Review Date: 2025-11-17

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Story is concrete: endpoints, CSV order, errors, metadata, and flag behavior defined.
- Emphasis on using persisted edits prevents stale publish; requirements are clear.

### Acceptance Criteria Validation
- AC1: Clear (export endpoints + CSV order + metadata).
- AC2: Clear (publish endpoint + per-entry status + error detail).
- AC3: Clear (latest saved edits).
- AC4: Clear (no SSE regression).

### Test Coverage Expectations
- Unit: export formatting (JSON/CSV), status envelope.
- Integration: edit → save → publish/export; negative (stale run, unsupported channel, missing auth).

### Gate
- Recommendation: PASS for dev readiness.

### QA Results (Post-Implementation)
- Review Date: 2025-11-18
- Reviewed By: Quinn (Test Architect)
- Gate: PASS — Export/publish implemented with flags, dryness, and persisted edits.
- Notes: OpenAPI/Proxies/Types updated; tests cover flag off/on, CSV/JSON export, unsupported channel, missing auth.

## Dev Agent Record
### Summary
- Added flagged export/publish flow using persisted calendar entries (JSON/CSV) with status metadata; implemented `POST /v1/ai/calendar/export` and wired through Next.js proxy with flag-off deterministic fallback.
- Extended publish plumbing with runId support and Supabase-backed dry-run intent persistence; added CSV formatting helper and error handling (unsupported channel/auth missing).
- Updated OpenAPI schemas/paths and Supabase types/migrations; added tests covering flag off/on, export JSON/CSV, unsupported channel, and missing auth.

### Tests
- `npm run lint --prefix ireal-service`
- `npm run test --prefix ireal-service`

### File List
- `ireal-service/src/ai/ai.service.ts`
- `ireal-service/src/ai/ai.controller.ts`
- `ireal-service/src/ai/ai.service.spec.ts`
- `ireal-service/src/ai/dto/export-calendar.dto.ts`
- `ireal-service/src/ai/dto/publish.dto.ts`
- `ireal-service/src/common/supabase/supabase.types.ts`
- `ireal_demo/app/api/ai/publish/route.ts`
- `ireal_demo/app/api/ai/calendar/export/route.ts`
- `ireal_demo/scripts/005_publish_intents.sql`
- `ireal_demo/scripts/002_enable_rls.sql`
- `docs/api/openapi.yaml`
- `docs/epics/epic-2-ops-runbook.md`
- `docs/qa/gates/epic-2-functional-readiness.2.2-calendar-e2e-export-publish.yml`

### Change Log
- 2025-11-18: Implemented export/publish E2E (flagged), dry-run intent persistence, CSV/JSON export, proxy + OpenAPI updates, and tests. (James)
