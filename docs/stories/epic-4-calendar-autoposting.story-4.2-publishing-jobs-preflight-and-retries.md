# Story 4.2 - Publishing Jobs, Preflight, and Retries

Status: Draft  
Epic: docs/epics/epic-4-calendar-autoposting.md

## Story
As a creator,
I want autoposting to run reliably with clear failures,
so that scheduled posts publish (or alert me) without surprises.

## Acceptance Criteria
1. Publish jobs table with status (`scheduled|publishing|published|failed|needs_attention`), attempt_count, last_error, next_attempt_at; attempts table records each try.  
2. Worker/queue processes jobs for IG/TikTok using official APIs/SDKs; capped retries = 3 with backoff 5m/15m/30m; after that status = needs_attention with error surfaced.  
3. Preflight: media present and token valid before publish; if not, job marks needs_attention, no attempts made, UI sees readiness.  
4. Endpoints: create/retry/reschedule/cancel publish jobs; publish-now (if platform allows) behind flag; responses include status and last_error.  
5. Logging/metrics: publish attempts log request/job IDs, channel, status, error code; exposed to observability pipeline.

## Integration Verification
IV1. Scheduled job publishes successfully (happy path) and marks entry published.  
IV2. Missing media or expired token marks needs_attention without attempts.  
IV3. Failure path retries 3x with backoff, then surfaces needs_attention + error to UI.  
IV4. Publish-now (flagged) triggers immediate attempt and reports status.

## Dependencies
- Story 4.1 readiness and account linkage.  
- Architecture updates: 05-component-architecture, 06-api-design (publishing), 07-data-models (PublishJobs/Attempts), 08-security-reliability (preflight/retries).

## Tasks / Subtasks
- [ ] Migrations for `publish_jobs` and `publish_attempts`; service layer with preflight + retry/backoff.  
- [ ] Worker/queue wiring; channel adapters using official APIs; feature flags for publish-now.  
- [ ] API endpoints for create/retry/reschedule/cancel/publish-now; update OpenAPI.  
- [ ] Logging/metrics for attempts and failures; surface status to Next.js proxies/UI.

### Testing
- Unit: preflight logic, retry scheduler, status transitions.  
- Integration: happy path publish, missing media/token path, failure/retry path.  
- E2E/manual/Playwright: schedule -> publish -> see tile published; induce failure -> see needs_attention and error; retry-now works.

## Change Log
| Date       | Version | Description      | Author |
|------------|---------|------------------|--------|
| 2025-12-15 | v0.1    | Initial draft    | PO     |
