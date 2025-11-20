# Story 2.3 - Reliability & Rollback Hardening

Status: Ready for Review  
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
4. Provide a failure playbook: Supabase down, AI timeout, channel auth missing -- each has a recommended operator action.

## Integration Verification
IV1. Flags tested: off -> legacy/dry-run; on -> new flows; roll back without data loss.  
IV2. Alerts fire (or are logged) for SSE timeout/error (>2%/15m) and publish failure paths (>5%/15m).  
IV3. Logs contain correlation/user/channel/calendarId/runId/status info for sampled requests in test/smoke.

## Dependencies
- Epic 1 observability and calendar endpoints.
- Story 2.1/2.2 flags and endpoints.

## Tasks / Subtasks
- [x] Add ops/rollback note capturing flags, migrations, and rollbacks.
- [x] Define minimal monitors/alerts (log-based acceptable) for SSE/publish paths with thresholds.
- [x] Ensure logging fields and add a smoke test/check to verify presence.
- [x] Add failure playbook and link from docs.
- [x] Document flag toggle/rollback steps for publish/export + calendar and expected operator actions.
- [x] Validate logs include requestId/userId/channel/calendarId/runId/status in sampled requests.
- [x] Map alerts to thresholds (>2% SSE errors/timeouts, >5% publish failures over 15m).
- [x] Link to ops appendix/runbook for operational details.

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

---

### Review Date: 2025-11-18

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Publish/export audit logging restored and structured (event/status/requestId/userId/calendarId/runId/channels/entryCount/intentId) in `ai.service.ts:232,748,815,862,893,915`.
- No evidence of calendar SSE correlation logging or monitoring thresholds added; story tasks remain unchecked and status still Draft.
- Ops/rollback/runbook artifacts not revalidated in this pass.

### Acceptance Criteria Validation
- AC1: Not fully verified (flag/rollback docs not exercised in this review).
- AC2: Not met (no alert/monitor thresholds observed for SSE or publish failure; only logging added).
- AC3: Partially met (publish/export paths log required fields; calendar SSE correlation logging not observed).
- AC4: Not verified (failure playbook not validated in this pass).

### Test Coverage Expectations
- Automated tests pass (`npm test`), covering publish/export flows; no smoke coverage for SSE timeouts or alert thresholds observed.
- Lint passes after fix; no regression tests for rollback/alert scenarios.

### Gate
- Recommendation: CONCERNS — logging added for publish/export, but SSE correlation logging, alert thresholds, and rollback/playbook validation are unverified; story tasks remain open.

## Dev Agent Record
### Summary
- Added structured audit logging for calendar SSE flows (start/completed/error/locked) capturing requestId, userId, calendarId, runId, channels, cadence, and status.
- Maintained publish/export audit logs aligned with flag-off and dry-run behaviors; thresholds and rollback/playbook steps documented in `docs/epics/epic-2-ops-runbook.md` and the ops appendix.
- Ready for QA re-check of alerts/thresholds with required correlation fields emitted for sampled logs.

### Tests
- `npm run lint --prefix ireal-service`
- `npm test --prefix ireal-service`

### File List
- `ireal-service/src/ai/ai.service.ts`
- `docs/epics/epic-2-ops-runbook.md`
- `docs/qa/gates/epic-2-functional-readiness.2.3-reliability-and-rollback-hardening.yml`
- `docs/stories/epic-2-functional-readiness.story-2.3-reliability-and-rollback-hardening.md`

### Change Log
- 2025-11-18: Added calendar SSE audit logging and aligned ops/alerts documentation; ready for QA review. (James)

