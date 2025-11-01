# 5. Component Architecture

## New Component: ireal-service (NestJS)
- **Responsibility:** Centralize domain logic (ideas, plans, pieces, ai), validation, and reliability controls
- **Integration Points:**
  - Next.js calls service REST `/v1/*`
  - Supabase auth context forwarded via JWT/session token for ownership checks
- **Interfaces:** REST endpoints; OpenAPI spec tracked at `docs/api/openapi.yaml`
- **Dependencies:** Supabase (auth/db/storage); new rate limiter, logger, metrics packages

## Service Modules
- `auth` (stub): validate user context; no credential storage
- `ideas`: CRUD/search with ownership and pagination
- `plans`: CRUD; section CRUD + reorder; attach plan to idea
- `ai`: provider abstraction for generate/nudge/plan-chat/calendar
- `pieces`: asset metadata management; Supabase storage integration
