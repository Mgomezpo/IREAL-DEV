# Story 1.5 – Migrate Ideas to Service

Status: Draft
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a user,
I want ideas endpoints to run on the service without breaking the UI,
so that performance and reliability improve while behavior stays familiar.

## Acceptance Criteria
1. Implement `/v1/ideas` CRUD + search with ownership checks and pagination
2. Next routes proxy to service or retire; UI behavior unchanged
3. Basic seed/test data path for local verification
4. List/search supports `q` (text) and `limit/offset` with sensible defaults; pagination metadata returned
5. Ownership enforced by user context; cross-tenant access prevented
6. Feature flag controls Next proxy to the service for rollback

## Integration Verification
IV1. UI lists, searches, creates, deletes ideas as before
IV2. AuthZ verified with test users; no cross-tenant access
IV3. p95 latency < 300 ms maintained for non-AI ops

## Dependencies
- Stories 1.1–1.4 completed

---
