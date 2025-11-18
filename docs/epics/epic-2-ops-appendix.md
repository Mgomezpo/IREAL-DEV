# Epic 2 Ops Appendix - Calendar/Publish

Purpose: Concrete operational guidance for calendar generation, export, and publish flows (TikTok/Instagram, dry-run-first).

## Flags & Modes
- `CALENDAR_SERVICE_ENABLED` (existing): toggles calendar service/proxy behavior.
- `PUBLISH_SERVICE_ENABLED` (new): guards publish/export endpoints and channel adapters.
- Flag OFF: serve legacy/dry-run responses only; never hit adapters.
- Flag ON: enable adapters/export; still allow dry-run to avoid external side effects.

## Rollback Steps
1) Toggle `PUBLISH_SERVICE_ENABLED` to false; keep data intact.
2) If calendar instability occurs, toggle `CALENDAR_SERVICE_ENABLED` to false to fall back to legacy stream.
3) Do not drop additive tables; keep history (runs, entries, publish intents).
4) Revert Next.js proxies to legacy if service unreachable; restore flag when healthy.

## Data & Persistence
- Keep Supabase tables: `calendar_runs`, `calendar_entries`; add `publish_intents` table (id, calendar_id, run_id, user_id, channel, payload, status, error, created_at).
- Publish/export must read latest saved entries (including manual edits).

## Monitoring & Alerts
- Metrics/Logs to watch:
  - SSE errors/timeouts for `/v1/ai/calendar` proxies.
  - Publish failures (per entry) for supported channels.
  - Latency spikes on publish/export endpoints.
- Minimum alerting (log-based acceptable):
  - >2% SSE error/timeout rate over 15m.
  - Any publish failure rate >5% over 15m or first failure after deploy.
  - Adapter auth/config missing event.
- Log fields required: `requestId`, `userId`, `channel`, `calendarId`, `runId`, `status`.

## Failure Playbook
- Supabase down/unreachable: serve legacy/dry-run responses; queue intent in memory/log; retry after recovery.
- AI timeout: return partial calendar + timeout message; keep flag on; no publish attempt.
- Channel auth missing/invalid: return clear 4xx with channel name; do not attempt publish.
- Adapter failure (dry-run): record failure reason, return partial success where possible; alert if threshold exceeded.

## Deployment/Release Notes
- Ship flags off; run smoke: calendar generate (flag off), export/publish (flag off) should return deterministic dry-run.
- Enable `CALENDAR_SERVICE_ENABLED` first (already used in Epic 1), then enable `PUBLISH_SERVICE_ENABLED` for limited users.
- Validate logs contain required fields before full rollout.
