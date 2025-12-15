# Implementation Readiness - Epic 4 (Calendar Autoposting & Unified Modal)

## Summary
- Scope: IG/TikTok single-account autoposting, readiness-aware calendar, unified IG-style modal, publish retries.
- Artifacts aligned: PRD FR-4/FR-5b, UX spec (`docs/ux/calendar-autoposting-ux-spec.md`), architecture shards (modules/APIs/models/security), epic/stories 4.1–4.3, test design (`docs/qa/test-design-epic-4-calendar-autoposting.md`).

## Preconditions
- Flags planned: publish-now and any channel-publish enablement should be feature-flagged.
- Data model: migrations for `channel_accounts`, readiness on `calendar_entries`, `publish_jobs`, `publish_attempts` (additive).
- APIs: account link/list/delete; calendar entry readiness/bulk shift; publishing job create/retry/reschedule/cancel/publish-now (flagged); OpenAPI updated.
- Queue/worker: required for publish attempts with retries/backoff.

## Risks & Mitigations
- Platform API/ban: use official SDKs, rate limiting, backoff.
- Token expiry: enforce refresh; surface token_expired readiness.
- Publish failures: preflight media/token; retries capped; needs_attention state.

## Validation Plan (must-pass signals)
- Link IG/TikTok -> status ok/timezone returned; readiness propagates to tiles.
- Drag/drop + bulk shift persist schedule; readiness badges correct.
- Modal shows AI-prefills and per-channel fields; warnings shown when media/token missing.
- Publish pipeline: happy path publishes; missing media/token → needs_attention without attempts; failure → retries 3x (5m/15m/30m) then needs_attention with error.
- Logs: publish attempts include request/job IDs, channel, status, error code.

## Go/No-Go Checklist
- [ ] Migrations applied (accounts, readiness, publish jobs/attempts)
- [ ] Flags wired and default-off for publish-now
- [ ] Queue/worker configured and monitored
- [ ] OpenAPI/docs updated
- [ ] Tests passing per test design (unit/integration/UI/E2E critical paths)
- [ ] Rollback: disable flags; keep data tables (additive) intact
