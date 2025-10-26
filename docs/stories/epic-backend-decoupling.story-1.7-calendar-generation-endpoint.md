# Story 1.7 – Calendar Generation Endpoint

Status: Draft
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a user,
I can generate and edit content calendars reliably,
so that I can plan my publishing cadence with AI help.

## Acceptance Criteria
1. `POST /v1/calendar/generate` with constraints (channels, cadence, start/end)
2. Persist schedules and support regeneration with diffs
3. Timeouts and per-user limits applied; streaming/chunk responses for long runs

## Integration Verification
IV1. UI calendar flow remains intact; edited events persist
IV2. Long generations stream without locking the UI
IV3. Timeout behavior is graceful; partial results handled

## Dependencies
- Stories 1.1–1.6 completed

---

