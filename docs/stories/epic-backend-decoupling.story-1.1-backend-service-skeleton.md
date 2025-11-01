# Story 1.1 – Backend Service Skeleton (NestJS)

Status: Ready for Review
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
IV1. Next.js app unaffected: `pnpm --filter ireal_demo dev` and `pnpm --filter ireal_demo build` succeed while service runs separately
IV2. Health and metrics endpoints reachable locally and return expected schema
IV3. No secrets logged; env validation fails fast with clear errors

## Additional Details
- Dev quickstart: see `docs/dev-quickstart.md` for running Next + service together
- Folder structure clarity prevents ambiguity during scaffolding and future story work.
- Explicit env var names ensure consistency with current Next/Supabase setup while moving secrets server-side.

## Dependencies
- PRD: docs/prd.md
- Epic: docs/epics/epic-backend-decoupling.md

## Notes / Out of Scope
- No domain migration yet; only scaffolding and foundations

---

## Dev Agent Record
### Summary
- Scaffolded `ireal-service` NestJS backend with domain modules, config validation, health/metrics endpoints, and OpenAPI serving.
- Added developer quickstart, updated UX streaming guidance, and generated OpenAPI spec artifact.
### Tests
- `npm run lint` (ireal-service)
- `npm run build` (ireal-service)
- `npm run openapi` (with temporary env vars for validation)
### File List
- `ireal-service/**`
- `docs/dev-quickstart.md`
- `docs/api/openapi.yaml`
- `docs/prd/06-ux-ui-notes.md`

## QA Results
- **Decision:** PASS — acceptance criteria are testable and align with architecture/PRD. The story establishes the foundational service skeleton without touching existing user flows.
- **Key Findings:**
  - Folder/module layout, env schema, OpenAPI export, and Prometheus metrics cover core reliability needs.
  - Integration verification should reference actual commands (`pnpm --filter ireal_demo dev`) to match the repo; recommend updating during implementation.
- **Test Recommendations:**
  - Unit tests for env validation (happy + missing vars) and module bootstrapping.
  - E2E smoke validating `/healthz`, `/metrics`, `/v1/openapi.json` responses and ensuring `pnpm build` for Next still passes.
  - CI job asserting OpenAPI artifact emitted to `docs/api/openapi.yaml`.
- **Risks / Follow-ups:**
  - Ensure `.env` templates are created so env validation failures are actionable.
  - Confirm service port doesn’t clash with existing dev tooling; document defaults in quickstart.
