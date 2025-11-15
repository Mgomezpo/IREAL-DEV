# 3. Enhancement Scope and Integration Strategy

- Enhancement Type: Backend decoupling and reliability uplift
- Strangler Approach:
  1. Keep Next.js as web + BFF; introduce `ireal-service` (NestJS) as a separate backend
  2. Migrate domains in order: ideas → plans/sections → calendar
  3. Use a thin proxy in Next during migration; retire routes once clients pivot to the service
- Boundaries and Compatibility:
  - Versioned REST `/v1` on the service with DTO validation
  - Response envelope `{ data, error, meta }` with consistent error codes
  - Preserve current UI behavior and URL structure throughout migration
- Calendar migration introduces persistent run history (`calendar_runs`/`calendar_entries`) plus feature-flagged SSE streaming to keep Next.js fallback intact.
