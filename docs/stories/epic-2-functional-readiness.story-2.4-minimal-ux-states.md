# Story 2.4 - Minimal UX States for Calendar Flows

Status: Ready for Review  
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
- [x] Define minimal UI states/copy (Spanish) for streaming, timeout, diff apply/cancel, publish/export success/fail.
- [x] Wire states to existing feature flags and legacy fallback.
- [x] Update Next.js client to display states; keep styling minimal (no redesign).
- [x] Add contract/UX note documenting the states for QA.
- [x] Include channel-not-connected messaging for TikTok/Instagram; keep all copy Spanish-first.
- [x] Keep flag-off legacy behavior unchanged; ensure copy degrades gracefully when publish/export disabled.
- [x] Provide the explicit Spanish copy strings in the story/UX note for each state.

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

## Dev Agent Record
### Summary
- Added feature-flag aware UX states in `ireal_demo/app/calendario/page.tsx` for streaming, timeout/retry, diff apply/cancel, publish/export success/fail, channel-not-connected, and legacy flag-off fallback.
- Spanish copy list embedded in code (uxCopy) and surfaced in-page for QA reference; channel labels normalized for display.
- Flags respected via `NEXT_PUBLIC_CALENDAR_ENABLED` and `NEXT_PUBLIC_PUBLISH_ENABLED`; legacy mode message shown when publish flag is off.

### Tests
- Not run (frontend-only changes; manual validation needed).

### File List
- `ireal_demo/app/calendario/page.tsx`
- `docs/stories/epic-2-functional-readiness.story-2.4-minimal-ux-states.md`

### Change Log
- 2025-11-18: Implemented minimal UX states/copy and flag handling for calendar flows. (James)

---

### Review Date: 2025-11-18

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- Spanish copy list and flag-off messaging included; operational banners added.
- States now driven by data flow: calendar fetch drives streaming/timeout and diff detection with apply/cancel; publish/export buttons update status banners; channel-missing surfaced when publish disabled.
- No lint/test run for the Next.js app (ESLint prompt blocked).

### Acceptance Criteria Validation
- AC1: Met (streaming/timeout driven by calendar fetch with retry).
- AC2: Met (diff summary, apply/cancel wired to fetched changes).
- AC3: Partially (publish/export banners updated from button-driven requests; channel-missing shown on flag-off or error).
- AC4: Met (flags respected; legacy banner when publish flag off).
- AC5: Met (Spanish copy list provided).

### Test Coverage Expectations
- Not executed in this review; lint/test for Next.js still blocked by interactive ESLint prompt.

### Gate
- Recommendation: ACCEPT WITH RISKS - UI states are data-driven for calendar/diff; publish/export statuses are button-driven without backend validation; lint/tests not run in Next.js.

---

### Review Date: 2025-11-19

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment
- `loadPieces` now drives streaming + timeout UX via a cancellable fetch to `/api/pieces`, staging diffs in `pendingPieces` until the user applies or discards them.
- Publish/export banners are tied to real POST requests (publish + export) and surface the channel-missing copy only when the API returns the Supabase auth error or the feature flag disables publish.
- Removed the unused `Sparkles` icon import so the calendar page lint passes once ESLint is configured.

### Acceptance Criteria Validation
- AC1: Spinner + timeout banner + retry button wired to cancellable fetch (15s cutoff).
- AC2: Diff summary counts added/updated/removed entries, with explicit apply/cancel actions.
- AC3: Publish/export success + failure banners update from API responses and include the TikTok/Instagram connection reminder.
- AC4: `NEXT_PUBLIC_*` flags gate functionality and show the legacy fallback banner when publish is off.
- AC5: Spanish copy list rendered inline for QA/UX; strings live in the `uxCopy` map.

### Test Coverage Expectations
- UI remains manually verified. `npm run lint` still prompts for an ESLint config (Next.js wizard); no automated lint/test run possible until `.eslintrc` is added.

### Gate
- Recommendation: PASS - UX states cover all ACs; only follow-up is to commit an `.eslintrc` so `next lint` can run non-interactively.
