# Story 2.4 - Minimal UX States for Calendar Flows

Status: Draft  
Epic: docs/epics/epic-2-functional-readiness.md
Priority: P2  
Owner: Frontend/UX

## Story
As a user,
I want clear states for calendar streaming, errors, and publish/export actions,
so that I can complete flows even if the UI is visually rough.

## Acceptance Criteria
1. Add loading/streaming indicators and heartbeat/timeout messaging for calendar generation; surface graceful timeout copy with retry.
2. Add error/diff-apply messaging for regeneration: users see what changed (added/updated/removed) and can choose to apply or cancel.
3. Add publish/export status messaging: success/failure per entry or summary; channel-not-connected copy for TikTok/Instagram.
4. All states respect feature flags (legacy fallback still works) and remain Spanish-first.
5. Provide explicit Spanish copy list for: streaming/loading, timeout with retry, diff apply/cancel, publish/export success/fail, channel-not-connected.

## Integration Verification
IV1. Calendar generation shows streaming/loading and timeout message; retry works.  
IV2. Regeneration shows diff summary and apply/cancel paths; fall back cleanly.  
IV3. Publish/export paths show success/fail status and channel-not-connected message.

## Dependencies
- Stories 2.1/2.2 for channel/publish/export endpoints.
- Existing calendar UI flows from Epic 1.

## Tasks / Subtasks
- [ ] Define minimal UI states/copy (Spanish) for streaming, timeout, diff apply/cancel, publish/export success/fail.
- [ ] Wire states to existing feature flags and legacy fallback.
- [ ] Update Next.js client to display states; keep styling minimal (no redesign).
- [ ] Add contract/UX note documenting the states for QA.
- [ ] Include channel-not-connected messaging for TikTok/Instagram; keep all copy Spanish-first.
- [ ] Keep flag-off legacy behavior unchanged; ensure copy degrades gracefully when publish/export disabled.
- [ ] Provide the explicit Spanish copy strings in the story/UX note for each state.

## Testing
- Manual/automated UI tests covering streaming, timeout, diff apply/cancel, publish/export success/fail, and channel-not-connected paths.

## QA Results

### Review Date: 2025-11-17

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Story is minimal-by-design; explicit copy list required and noted. Flag-off behavior called out.
- Ready for dev once copy strings are provided in the story/UX note.

### Acceptance Criteria Validation
- AC1-AC5: Clear; copy list explicitly required.

### Test Coverage Expectations
- UI tests for streaming/loading, timeout retry, diff apply/cancel, publish/export status, channel-not-connected, and flag-off legacy path.

### Gate
- Recommendation: PASS for dev readiness (pending addition of Spanish copy list as part of implementation).
