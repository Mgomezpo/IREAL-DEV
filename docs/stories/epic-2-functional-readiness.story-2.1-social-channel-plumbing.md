# Story 2.1 - Social Channel Plumbing (TikTok/Instagram)

Status: Ready for Review  
Epic: docs/epics/epic-2-functional-readiness.md  
Priority: P1  
Owner: Backend/AI

## Story
As an operator,
I want basic channel plumbing for TikTok and Instagram (including dry-run adapters),
so that calendar entries can target real channels and be validated end-to-end even if visuals are rough.

## Acceptance Criteria
1. Introduce channel enums `{tiktok, instagram}` (env-driven support map) and validate calendar entries so only supported channels pass; unsupported channels return a 400 with code `CHANNEL_UNSUPPORTED`.
2. Provide publish adapter interfaces with dry-run implementations that record intent (channel, payload, userId, calendarId, runId) and return success/failure metadata without external side effects.
3. Wire calendar generation to respect supported channels and surface per-entry channel info through the API/proxies for downstream publish/export.
4. Feature flag (`PUBLISH_SERVICE_ENABLED` or reuse existing pattern) guards publishing endpoints `POST /v1/ai/publish` (service) and `/app/api/ai/publish` (proxy); when off, return deterministic legacy/dry-run responses.
5. Missing/invalid channel auth config returns 400 with a clear code/message per channel; no external attempt is made.

## Integration Verification
IV1. Calendar generation accepts only TikTok/Instagram; unsupported values fail fast with 4xx and descriptive errors.  
IV2. Dry-run publish requests persist intent/metadata and return standardized envelope and status.  
IV3. Flag off → no publish calls; flag on → dry-run paths executed and logged; UI behavior unchanged otherwise.

## Dependencies
- Epic 1 service foundation and calendar endpoints completed.
- Supabase schema available for recording publish intents (can be additive).

## Tasks / Subtasks
- [x] Add channel config and validation (shared enums/types).
- [x] Implement publish adapter interface + dry-run adapters (TikTok/Instagram) returning envelope + metadata.
- [x] Expose/guard publish endpoint(s) (`POST /v1/ai/publish` + proxy) with feature flag and reuse auth/ownership checks.
- [x] Add persistence/logging of publish intents (Supabase additive table) with request/response metadata.
- [x] Update tests (validation + dry-run publish) and doc any new env vars/flags.
- [x] Env/flags: add `PUBLISH_SERVICE_ENABLED`; channel credentials placeholders (e.g., `TIKTOK_APP_ID`, `INSTAGRAM_APP_ID`) may be optional in dry-run mode—document behavior.
- [x] Data: additive table `publish_intents` { id, calendar_id, run_id, user_id, channel, payload, status, error, created_at }.

## Dev Notes
- Reuse existing envelope `{ data, error, meta }`; responses should include per-request `requestId`, `channel`, and status.
- Dry-run adapters must not call external services; they must persist intent and return synthetic success/fail metadata.
- Validation should align with calendar channel enums used in generation to avoid mismatches.
- Feature flag default = off; ensure flag-off responses are deterministic for UI.
- Error codes to standardize: `CHANNEL_UNSUPPORTED`, `CHANNEL_AUTH_MISSING`, `CHANNEL_AUTH_INVALID`.

## Testing
- Unit tests for channel validation, adapter behavior, and flag-off/on responses.
- Integration test for dry-run publish flow (service) and proxy passthrough, including unsupported channel (400) and missing auth (400) cases.

## QA Results

### Review Date: 2025-11-17

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Story clarity: endpoints, enums, flags, and error codes specified; data table defined; dry-run intent persistence noted.
- Gaps: None blocking; ready for dev.

### Acceptance Criteria Validation
- AC1: Clear (channel enums + 400 code).
- AC2: Clear (dry-run adapters persist intent/metadata).
- AC3: Clear (channel surfaced via API).
- AC4: Clear (flag + endpoints).
- AC5: Clear (auth missing/invalid error).

### Test Coverage Expectations
- Unit: channel validation, error codes, adapter behavior, flag off/on.
- Integration: publish dry-run, unsupported channel 400, missing auth 400, intent persistence.

### Gate
- Recommendation: PASS for dev readiness.

## Dev Agent Record
### Summary
- Added publish plumbing with supported channel enums and new `POST /v1/ai/publish` endpoint (flagged), including Supabase-backed dry-run intent persistence and validation/error codes.
- Introduced `publish_intents` table + RLS/migration, updated Supabase types, and documented APIs in OpenAPI; added Next.js proxy with flag-off deterministic fallback.
- Extended AI service tests for publish flows (flag off/on, unsupported channel, missing auth) and ran lint/tests.

### Tests
- `npm run lint --prefix ireal-service`
- `npm run test --prefix ireal-service`

### File List
- `ireal-service/src/ai/ai.service.ts`
- `ireal-service/src/ai/ai.controller.ts`
- `ireal-service/src/ai/dto/publish.dto.ts`
- `ireal-service/src/ai/ai.service.spec.ts`
- `ireal-service/src/common/supabase/supabase.types.ts`
- `ireal_demo/app/api/ai/publish/route.ts`
- `ireal_demo/scripts/005_publish_intents.sql`
- `ireal_demo/scripts/002_enable_rls.sql`
- `docs/api/openapi.yaml`
- `docs/epics/epic-2-ops-runbook.md`
- `docs/qa/gates/epic-2-functional-readiness.2.1-social-channel-plumbing.yml`

### Change Log
- 2025-11-17: Implemented publish plumbing (flagged), dry-run adapters, intent persistence, proxy, OpenAPI, and tests. (James)
