# 5. Component Architecture

## New Component: ireal-service (NestJS)
- **Responsibility:** Centralize domain logic (ideas, plans, pieces, ai, calendar/publishing), validation, and reliability controls
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
- `calendar`: generate/save calendar entries, store runs, readiness states; expose list/update endpoints
- `publishing`: schedule/reschedule publish jobs, manage retries/backoff, surface status; worker consumes queue
- `accounts`: channel linkage (IG/TikTok), token storage/refresh (encrypted), per-account timezone
- `notifications`: in-app alerts; hook for email later

## Autoposting Flow (service)
- Next writes/edits calendar entries via service; service creates publish jobs with state (scheduled → publishing → published | failed -> retry | needs_attention)
- Queue/worker processes publish jobs; uses channel SDK/API; retries 3x with backoff (5m/15m/30m)
- Readiness checks: media present, token valid; if missing -> needs_attention; resumes after fix
- Status surfaces to Next for tile badges and modal warnings
