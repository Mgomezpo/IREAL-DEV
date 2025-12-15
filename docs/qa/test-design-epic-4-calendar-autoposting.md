# Test Design - Epic 4: Calendar Autoposting & Unified Modal

## Scope
- IG/TikTok single-account linkage, readiness badges, drag/drop + bulk shift, unified IG-style modal, autoposting pipeline (preflight, retries, needs-attention).

## Objectives
- Verify account linkage/readiness surfaces to UI.
- Validate calendar entry readiness lifecycle and scheduling edits.
- Ensure publish jobs obey preflight and retry/backoff rules, surfacing failures.
- Confirm modal UX shows AI-prefills, per-channel fields, and warnings.

## Test Areas & Scenarios
1) Account linkage & readiness
   - Link IG/TikTok: tokens stored encrypted, timezone returned, status=ok.
   - Expired token: status=expired -> readiness shows token_expired; relink clears.
   - Delete account removes scheduleability; tiles reflect missing account.
2) Calendar readiness & scheduling
   - Calendar entries return readiness (ready/missing_media/token_expired/failed_retry/published/needs_attention).
   - Drag/drop reschedule persists; bulk shift updates all selected entries; backend times updated.
   - Missing media flag: entry shows needs_attention until media uploaded; clears after upload.
3) Modal UX
   - Modal shows AI-prefilled caption/hashtags/time; per-channel fields rendered (IG tags/location/AI label; TikTok caption/hashtags/sound if available).
   - Readiness warnings in modal (missing media/token/failed retry) with resolve actions (upload, relink, retry).
   - Save draft/schedule/publish-now (if enabled) updates entry and tile status.
4) Publish pipeline
   - Happy path: scheduled -> publishing -> published; tile shows published.
   - Preflight: missing media or token -> needs_attention; no attempts fired.
   - Retry: forced failure triggers 3 retries at 5m/15m/30m intervals; after max, status=needs_attention with last_error populated.
   - Retry-now endpoint resumes and marks published on success.
5) Observability & flags
   - Logs include request/job IDs, channel, status, error code for attempts.
   - Feature flags: publish-now behind flag; behavior off/on verified.

## Test Types
- Unit: preflight logic, retry scheduler, readiness transitions, DTO validation.
- Integration (service + DB): account link/list/delete; calendar readiness; publish job lifecycle; attempts recorded.
- Contract/API: endpoints for accounts, calendar entries (readiness), publishing jobs; OpenAPI matches responses.
- UI/Playwright/manual: link account -> calendar badges; drag/drop/bulk shift persists; modal warnings; publish-now path; resolve missing media/token clears warnings.
- A11y: keyboard navigation for calendar and modal; focus-visible.

## Exit Criteria
- All P1 scenarios pass; no P0/P1 defects open for account linkage, readiness, publish retries, and modal actions.
- Logs/metrics present for publish attempts and readiness changes.

## References
- PRD: `docs/prd/03-functional-requirements.md` (FR-4/FR-5b)
- UX: `docs/ux/calendar-autoposting-ux-spec.md`
- Architecture: `docs/architecture/05-component-architecture.md`, `06-api-design.md`, `07-data-models.md`, `08-security-reliability.md`
- Epic/Stories: `docs/epics/epic-4-calendar-autoposting.md` and stories 4.1/4.2/4.3
