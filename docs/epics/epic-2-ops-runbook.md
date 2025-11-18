# Epic 2 Ops Runbook (Calendar, Export, Publish)

Purpose: Hands-on checklist for enabling/disabling calendar/publish flows and validating health during rollout.

## Pre-Deploy
- Confirm flags exist in env: `CALENDAR_SERVICE_ENABLED`, `PUBLISH_SERVICE_ENABLED` (default false).
- Ensure additive table exists: `publish_intents` (id, calendar_id, run_id, user_id, channel, payload, status, error, created_at).
- Verify calendar generate/save/load is healthy (Epic 1 smoke).
- Build/CI green for service and Next proxies.

## Deploy Steps
1) Deploy service + Next with flags OFF.
2) Smoke (flags OFF):
   - Calendar generate returns legacy/dry-run.
   - Export/publish endpoints return deterministic dry-run responses.
   - Logs contain requestId/userId.
3) Enable `CALENDAR_SERVICE_ENABLED` (if not already on) for canary users.
4) Enable `PUBLISH_SERVICE_ENABLED` for canary users/environments only.

## Smoke (Flags ON, Canary)
- Calendar generate: SSE streaming with keep-alives; final done meta present.
- Save/load calendar edits works; manual edit persists; diff/apply preserved.
- Export JSON/CSV returns entries with channels and status fields.
- Publish (dry-run): writes `publish_intents` rows; returns per-entry status; no external side effects.

## Monitoring & Alerts (log-based acceptable)
- SSE error/timeout rate >2% over 15m → alert.
- Publish failure rate >5% over 15m → alert.
- Missing channel auth/config event → alert.
- Required log fields: requestId, userId, channel, calendarId, runId, status.

## Rollback
- Toggle `PUBLISH_SERVICE_ENABLED` to false (keep data).
- If calendar unstable, toggle `CALENDAR_SERVICE_ENABLED` to false (legacy fallback).
- Leave Supabase tables intact; do not purge runs/entries/intents.
- Revert proxies to legacy only if service unavailable.

## Failure Playbook
- Supabase down: serve legacy/dry-run; queue intent in memory/log; retry after recovery.
- AI timeout: return partial + timeout message; do not attempt publish; keep flag on.
- Channel auth missing/invalid: 4xx with channel name; no publish attempt.
- Adapter failure (dry-run): record failure reason; partial success allowed; alert if threshold breached.

## Acceptance for Full Rollout
- All smokes pass on canary with flags ON.
- Logs show required fields; alerts tested once.
- Publish intent persistence confirmed; export matches saved edits.
- Ops sign-off recorded.
