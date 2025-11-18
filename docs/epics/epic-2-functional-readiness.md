# Epic 2 - Functional Readiness & Social Publishing (Rough-but-Working)

Status: Draft  
Owner: PO  
Goal: Make calendar→publish/export flows work end-to-end (even if visually rough), add channel plumbing (TikTok/Instagram), and harden ops/rollback basics.

## Objectives
- Enable calendars to target supported channels (TikTok/Instagram) with dry-run publishing/export.
- Preserve rollout safety: flags, fallbacks, and rollback guidance.
- Keep UI changes minimal: only essential states for loading/error/timeout/diff-apply.
- Improve operability: monitoring, alerting, and playbooks for calendar/publish failures.

## Scope
- Channel config + adapters (stub/dry-run acceptable) and data validation for supported channels.
- E2E flow: Idea → Plan → Calendar → Export/Publish with persisted status.
- Observability and ops notes for calendar/publish (timeouts, SSE errors, channel auth gaps).
- Minimal UX states to keep flows usable (no redesign).

## Out of Scope
- Full visual redesign/theme adjustments.
- Additional channels beyond TikTok/Instagram.
- Advanced scheduling/queueing or background workers (future).

## Success Criteria
- Calendar entries can be exported (JSON/CSV) and sent through a channel adapter (dry-run OK).
- Feature-flagged rollout with documented rollback path.
- Monitors/alerts defined for calendar SSE errors/timeouts and publish attempts.
- UI shows clear states for loading/error/timeout/diff-apply; users can retry/cancel.

## Priority & Sequencing
1) Story 2.1 (channel validation + dry-run adapters, flag) — Priority: P1 — Owner: Backend/AI  
2) Story 2.2 (export/publish using stored edits, per-entry status) — Priority: P1 — Owner: Backend/AI  
3) Story 2.3 (ops/rollback/monitoring/playbook) — Priority: P1 — Owner: Ops/Backend  
4) Story 2.4 (minimal UX states/copy wired to flags) — Priority: P2 — Owner: Frontend/UX

Entry criteria per story:
- 2.1: Calendar endpoints stable; flag available; Supabase table for publish intents ready (additive).
- 2.2: 2.1 channel enums/adapter interface in place; calendar save/load stable.
- 2.3: 2.1/2.2 flags defined; logging hooks available.
- 2.4: 2.1–2.3 endpoints/flags in place; Spanish copy provided.

## Stories
- Story 2.1 - Social Channel Plumbing (TikTok/Instagram)
- Story 2.2 - Calendar E2E Export/Publish
- Story 2.3 - Reliability & Rollback Hardening
- Story 2.4 - Minimal UX States for Calendar Flows

## Ops Appendix (Calendar/Publish)
- Flags: `PUBLISH_SERVICE_ENABLED` (new) and existing calendar flag; off = legacy/dry-run; on = new flows.
- Rollback: toggle flags off; retain Supabase entries; do not drop tables; revert proxies to legacy.
- Monitoring: alert on SSE error/timeout rates and publish failure counts; log fields must include requestId, userId, channel, calendarId.
- Failure playbook: Supabase down → retry later/serve cached/legacy; AI timeout → return partial + timeout message; channel auth missing → surface clear error + do not attempt publish.
- Reference: See ops note `docs/epics/epic-2-ops-appendix.md` for detailed steps.

## Risks
- Channel auth/config variability; mitigate with dry-run/default stubs.
- SSE instability; mitigate with keep-alives and timeout handling (reuse epic 1 patterns).
- Ops gaps; mitigate with playbooks and monitors before rollout.

## Post-MVP Backlog (for parking)
- Additional channels beyond TikTok/Instagram.
- Background queue for delayed/paced publishing.
- Analytics/operational dashboards for publish outcomes and SSE health.
