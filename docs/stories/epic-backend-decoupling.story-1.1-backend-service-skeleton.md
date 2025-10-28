# Story 1.1 – Backend Service Skeleton (NestJS)

Status: Draft
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a developer,
I want a NestJS service with modules for auth (stub), ideas, plans, pieces, and ai,
so that domain logic is centralized, testable, and ready for incremental migration.

## Acceptance Criteria
1. New repo/folder or package created: ireal-service (NestJS)
2. Modules bootstrapped: auth (stub), ideas, plans (sections), pieces, ai
3. Environment validation in place (required vars, safe defaults)
4. Health endpoint `/healthz` returns service/version/status
5. Metrics endpoint `/metrics` (Prometheus format or minimal JSON) exposed
6. OpenAPI scaffold generated and saved to `docs/api/openapi.yaml`
7. CI pipeline builds container, runs lint and typecheck
8. Module paths follow `src/{auth,ideas,plans,ai,pieces}` with top-level `common/` for shared DTOs/utilities
9. Env schema validates (no defaults): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AI_PROVIDER`, `AI_API_KEY`
10. OpenAPI is also served at `/v1/openapi.json` and exported during CI as artifact alongside `docs/api/openapi.yaml`
11. `/metrics` uses Prometheus exposition format with basic counters/histograms

## Integration Verification
IV1. Next.js app unaffected: `npm run dev` and `next build` succeed
IV2. Health and metrics endpoints reachable locally and return expected schema
IV3. No secrets logged; env validation fails fast with clear errors

## Additional Details
- Folder structure clarity prevents ambiguity during scaffolding and future story work.
- Explicit env var names ensure consistency with current Next/Supabase setup while moving secrets server-side.

## Dependencies
- PRD: docs/prd.md
- Epic: docs/epics/epic-backend-decoupling.md

## Notes / Out of Scope
- No domain migration yet; only scaffolding and foundations

---
