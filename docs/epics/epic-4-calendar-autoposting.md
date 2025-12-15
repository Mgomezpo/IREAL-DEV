# Epic 4 - Calendar Autoposting & Unified Modal

Status: Draft  
Owner: PO  
Goal: Deliver reliable IG/TikTok autoposting with a Buffer-like calendar, readiness states, and a unified IG-style modal that AI-prefills content but remains editable.

## Objectives
- Single-account IG/TikTok linkage with per-account timezone and token validity surfaced to the calendar.
- Readiness-aware calendar: tiles show missing media/token/failed retry/published; drag/drop and bulk shift keep schedule in sync.
- Autoposting pipeline with preflight checks, capped retries/backoff, and needs-attention surfacing.
- Unified modal (IG-style) for post editing with AI-prefilled caption/hashtags/cover/time and per-channel tweaks in one place.

## Scope
- Account linkage endpoints and storage (encrypted tokens, tz per account).
- Calendar entry readiness fields and badges; reschedule via drag/drop and bulk shift.
- Publish jobs/attempts with preflight, retries (3x at 5m/15m/30m), and failure surfacing.
- Modal UX aligned to `docs/ux/calendar-autoposting-ux-spec.md` and PRD FR-4/FR-5b.

## Out of Scope
- Multi-account selection in a single workspace (future).
- Additional channels beyond IG/TikTok.
- Advanced analytics/dashboards for publish outcomes (future).

## Success Criteria
- Users can connect IG/TikTok, see readiness on calendar tiles, and schedule/reschedule via drag/drop or bulk shift.
- Publish pipeline runs with preflight checks and capped retries; failures surface as needs-attention with clear errors.
- Unified modal provides AI defaults and per-channel options; edits persist and reflect on calendar entries.
- Data models and API endpoints match `docs/architecture/06-api-design.md` and `docs/architecture/07-data-models.md`.

## Priority & Sequencing
1) Story 4.1 - Channel Accounts & Readiness States (P1)
2) Story 4.2 - Publishing Jobs, Preflight, and Retries (P1)
3) Story 4.3 - Calendar UX & Unified Modal (P2)

Entry criteria:
- PRD FR-4/FR-5b updated (done).
- UX spec drafted (`docs/ux/calendar-autoposting-ux-spec.md`).
- Architecture shards updated (scope, modules, APIs, models, security).

## Stories
- Story 4.1 - Channel Accounts & Readiness States
- Story 4.2 - Publishing Jobs, Preflight, and Retries
- Story 4.3 - Calendar UX & Unified Modal

## Risks
- Platform API limits/ban risk: mitigate via official SDK/API use, rate limiting/backoff.
- Publish reliability: mitigate via preflight and capped retries with needs-attention state.
- Token expiry: mitigate with refresh and clear UI surfacing.
