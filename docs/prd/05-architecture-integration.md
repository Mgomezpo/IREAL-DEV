# 5. Architecture and Integration Plan

## Backend Decoupling Strategy
- Approach: Strangle pattern
  1) Keep Next.js as web + BFF for SSR/edge
  2) Introduce `ireal-service` as a separate containerized backend (NestJS recommended for TS synergy)
  3) Migrate domain logic: ideas, plans, pieces, calendar into the service incrementally
  4) Next.js API routes become thin proxies or are retired once clients use service
- Option: Python FastAPI microservice for AI pipelines if Python ecosystem is needed later; start with a single service to reduce complexity

## Technology Choices
- Service: NestJS (TS) with class-validator/class-transformer, OpenAPI; Alt: FastAPI (Python) with Pydantic
- DB: Continue on Supabase Postgres; access via service (pg/Prisma/Kysely) or Supabase client with service role
- Messaging (future): lightweight queue for async tasks (BullMQ/Celery) if needed

## API Contracts
- Versioned endpoints `/v1`; OpenAPI spec generated and stored in `docs/api/openapi.yaml`
- Consistent response envelope `{ data, error, meta }`; error codes standardized

## Security & Config
- Env-only secrets; rotate compromised keys; use server-only runtime
- RBAC groundwork: resource ownership checks per user id
- Rate limiting per user/IP for write and AI endpoints

## Observability
- Logger with request correlation id; redact secrets
- Health: `/healthz`; Metrics: `/metrics` (Prometheus format or minimal JSON)

## Deployment & Operations
- Frontend: Vercel (assumed)
- Service: containerized on managed platform (e.g., Render/Fly/Railway); CI to build and deploy
- Config management: `.env` per environment + secret store; feature flags minimal

