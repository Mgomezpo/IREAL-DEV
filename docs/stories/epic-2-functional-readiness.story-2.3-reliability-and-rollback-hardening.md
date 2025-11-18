# Story 2.3 - Reliability & Rollback Hardening

Status: Draft  
Epic: docs/epics/epic-2-functional-readiness.md
Priority: P1  
Owner: Ops/Backend

## Story
As an operator,
I want clear rollout controls, monitoring, and rollback steps for calendar/publish flows,
so that we can go live safely even while the UI remains rough.

## Acceptance Criteria
1. Document and enforce feature flags/migrations for calendar/publish (on/off behavior, legacy fallback, rollback steps) in an ops note.
2. Add monitoring/alerting for calendar SSE errors/timeouts and publish failures (log-based acceptable) with documented thresholds and log field requirements.
3. Ensure structured logs include requestId/userId/channel/calendarId for calendar/publish endpoints; verify logs in tests/smoke.
4. Provide a failure playbook: Supabase down, AI timeout, channel auth missing—each has a recommended operator action.

## Integration Verification
IV1. Flags tested: off → legacy/dry-run; on → new flows; roll back without data loss.  
IV2. Alerts fire (or are logged) for SSE timeout/error (>2%/15m) and publish failure paths (>5%/15m).  
IV3. Logs contain correlation/user/channel/calendarId/runId/status info for sampled requests in test/smoke.

## Dependencies
- Epic 1 observability and calendar endpoints.
- Story 2.1/2.2 flags and endpoints.

## Tasks / Subtasks
- [ ] Add ops/rollback note capturing flags, migrations, and rollbacks.
- [ ] Define minimal monitors/alerts (log-based acceptable) for SSE/publish paths with thresholds.
- [ ] Ensure logging fields and add a smoke test/check to verify presence.
- [ ] Add failure playbook and link from docs.
- [ ] Document flag toggle/rollback steps for publish/export + calendar and expected operator actions.
- [ ] Validate logs include requestId/userId/channel/calendarId/runId/status in sampled requests.
- [ ] Map alerts to thresholds (>2% SSE errors/timeouts, >5% publish failures over 15m).
- [ ] Link to ops appendix/runbook for operational details.

## Testing
- Manual/smoke validation of flag toggles and log fields.
- Automated/smoke check that error paths emit log entries with expected fields.

## QA Results

### Review Date: 2025-11-17

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Ops scope is explicit: flags, alerts, log fields, thresholds, and playbook; linked to ops appendix/runbook.
- Ready for dev; no gaps noted.

### Acceptance Criteria Validation
- AC1: Clear (flags/rollback documented).
- AC2: Clear (alerts + thresholds + log requirements).
- AC3: Clear (log fields enumerated).
- AC4: Clear (failure playbook).

### Test Coverage Expectations
- Smoke: flag off/on, rollback, sampled logs with required fields.
- Trigger sample SSE timeout/publish failure to validate alerts.

### Gate
- Recommendation: PASS for dev readiness.
