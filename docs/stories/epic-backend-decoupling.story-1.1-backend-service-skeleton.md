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

## Integration Verification
IV1. Next.js app unaffected: `npm run dev` and `next build` succeed
IV2. Health and metrics endpoints reachable locally and return expected schema
IV3. No secrets logged; env validation fails fast with clear errors

## Dependencies
- PRD: docs/prd.md
- Epic: docs/epics/epic-backend-decoupling.md

## Notes / Out of Scope
- No domain migration yet; only scaffolding and foundations

---

