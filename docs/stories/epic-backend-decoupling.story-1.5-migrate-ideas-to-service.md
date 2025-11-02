# Story 1.5 – Migrate Ideas to Service

Status: Ready for Review
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

## Dev Agent Record
### Summary
- Added Supabase infrastructure modules plus typed `IdeasService`/controller covering CRUD, search, and plan-attachment endpoints with explicit plan ownership validation and envelope responses.
- Replaced Next.js ideas API routes with service-aware proxies gated by `IDEAS_SERVICE_ENABLED`, including attach-plans handling and service client helper updates.
- Documented new env requirements, refreshed OpenAPI spec, and added seed script plus request-context utilities to support feature-flagged rollout.
### Tests
- `npm run lint` (ireal-service)
- `npm run test` (ireal-service)
- `npm run build` (ireal-service)
- `npm run openapi` (ireal-service; temporary stub env vars for Supabase + AI config)
- `npm run lint` (ireal_demo) (not run: local install missing `next` CLI; requires workspace install)
### File List
- `ireal-service/src/common/supabase/**`
- `ireal-service/src/ideas/**`
- `ireal-service/src/scripts/seed-ideas.ts`
- `ireal_demo/app/api/ideas/**`
- `ireal_demo/lib/request-context.ts`
- `ireal_demo/lib/service-client.ts`
- `ireal_demo/scripts/001_create_schema.sql`
- `docs/dev-quickstart.md`
- `docs/api/openapi.yaml`
