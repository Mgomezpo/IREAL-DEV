# Dev Quickstart: IREAL Frontend + Service

## Prerequisites
- Node.js 20.x (aligns with Next.js 14 + NestJS)
- pnpm 9.x (frontend uses pnpm per lockfile)
- npm 10.x for NestJS service scripts (or switch to pnpm later)
- Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- AI provider key (`AI_PROVIDER`, `AI_API_KEY`) stored in service `.env`

## Repo Layout
- `ireal_demo/` - existing Next.js app
- `ireal-service/` - NestJS backend (Story 1.1 deliverable)
- `docs/` - PRD, architecture, OpenAPI, stories, brief

## Environment Setup
1. Create `.env.local` in `ireal_demo/` and `.env` in `ireal-service/` (templates added in Story 1.1).
2. Populate at minimum:
   - Shared: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service: `AI_PROVIDER`, `AI_API_KEY`, optional `PORT`, rate-limit defaults (`RATE_LIMIT_WINDOW_SECONDS`, `AI_RATE_LIMIT_PER_USER`, `AI_RATE_LIMIT_PER_IP`, `WRITE_RATE_LIMIT_PER_USER`, `WRITE_RATE_LIMIT_PER_IP`), log config (`LOG_LEVEL`, `ERROR_LOG_SAMPLE_RATE`), Supabase service credentials (`SUPABASE_SERVICE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
   - Next.js server: `IREAL_SERVICE_URL` (e.g., `http://localhost:3333`) so API routes can proxy to the NestJS service
   - Feature flags: `IDEAS_SERVICE_ENABLED=true` (Story 1.5) and `PLANS_SERVICE_ENABLED=true` (Story 1.6) to route the Next.js API layer through the Nest service

## Install Dependencies
- From repo root run `pnpm install --filter ireal_demo...`
- Then run `npm install --prefix ireal-service`

## Run Dev Servers
- Terminal 1: `npm run start:dev --prefix ireal-service`
- Terminal 2: `pnpm --filter ireal_demo dev`
- During Stories 1.1-1.4 hit service endpoints directly (`http://localhost:3333/v1/...`).
- Story 1.5 introduces the feature flag above to route Next `/api/ideas/*` through the service.

## OpenAPI & Docs
- Refresh spec: `npm run openapi --prefix ireal-service` (Story 1.1 deliverable).
- Runtime contract lives at `/v1/openapi.json`; committed spec at `docs/api/openapi.yaml`.

## Testing & Linting
- Service: `npm run lint --prefix ireal-service`, `npm run test --prefix ireal-service`
- Frontend: `pnpm --filter ireal_demo lint`; add tests per story requirements.

## Troubleshooting
- Health check: `GET http://localhost:3333/healthz`
- Metrics: `GET http://localhost:3333/metrics`
- SSE (AI calendar): use EventSource/fetch streaming and confirm updates appear in console.

Maintainer: Product Owner. Update after Story milestones land.

### Utilities
- Seed domain data: `npm run seed:ideas --prefix ireal-service` (set `SEED_USER_ID` if you want a specific owner)
