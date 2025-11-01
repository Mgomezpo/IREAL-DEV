# 4. Tech Stack Decisions

- Backend Service: NestJS (TypeScript) for language parity, modularity, DI, and OpenAPI generation
  - Alternative (future): FastAPI for specialized AI pipelines; defer to avoid early split
- Data: Supabase Postgres; access via service-role connection or ORM (Kysely/Prisma) with least privilege
- Messaging (future): BullMQ or similar for async/background tasks if required
- Observability: Minimal logger (pino/winston) with correlation IDs; Prometheus-format metrics
