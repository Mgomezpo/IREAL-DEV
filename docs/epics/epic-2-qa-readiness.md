# Epic 2 QA Readiness & Entry Criteria

Scope: Functional Readiness & Social Publishing (TikTok/Instagram, rough-but-working).

## Entry Criteria per Story
- Story 2.1 (Channel Plumbing, P1)
  - Flags present (`PUBLISH_SERVICE_ENABLED`), channel enums defined, publish_intents table created.
  - Dry-run adapters available; validation rejects unsupported channels.
- Story 2.2 (Export/Publish E2E, P1)
  - Uses stored (edited) calendar entries; per-entry status returned.
  - Export JSON/CSV endpoints feature-flagged; publish returns status + error detail.
- Story 2.3 (Reliability/Rollback, P1)
  - Ops runbook/checklist available; monitoring thresholds defined; logging fields enforced.
  - Failure playbook documented; flag toggle behavior validated in test/smoke.
- Story 2.4 (Minimal UX States, P2)
  - Spanish copy for streaming/loading/timeout/diff-apply/publish/export/channel-not-connected.
  - States wired to flags; legacy fallback still works.

## QA Focus Areas
- Calendar generate: SSE keep-alives, done meta, timeout handling.
- Publish dry-run: intent persisted, status returned, no external side effects.
- Export: schema correctness, includes edited entries, channel data present.
- Flags: off → legacy/dry-run; on → new flows; rollback leaves data intact.
- UX states: loading/error/timeout/diff apply/cancel; publish/export status; channel-not-connected messaging (ES).

## Suggested QA Checklist (per environment)
- Flags OFF: Calendar/dry-run/publish/export deterministic responses; no external calls.
- Flags ON (canary): SSE stream stable; save/load edits; export valid; publish writes intent/status.
- Negative: unsupported channel rejected; missing auth returns clear 4xx; AI timeout surfaces partial + timeout message.
- Logs/alerts: required fields present; trigger a sample SSE timeout and publish failure to confirm alert path.

## Regression Guardrail
- Legacy flows still reachable when flags off.
- Supabase migrations additive; RLS unaffected.
- OpenAPI matches new endpoints (export/publish) and calendar streaming schema.
