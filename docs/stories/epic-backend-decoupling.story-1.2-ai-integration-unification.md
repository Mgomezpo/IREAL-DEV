# Story 1.2 - AI Integration Unification

Status: Ready for Review
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a developer,
I want a single AI client abstraction with a consistent request/response schema and streaming where applicable,
so that AI features are secure, reliable, and easier to maintain.

## Acceptance Criteria
1. Remove hardcoded API key from Next route(s); use env-only secrets in service
2. Implement AI client abstraction (provider config, retries with backoff, timeouts)
3. Standardize response envelope: `{id,type,content,metadata:{tokens,model,latencyMs},timestamp}`
4. Support streaming for long responses where applicable
5. Unit tests for error handling (provider failures, timeouts, invalid payloads)
6. All AI endpoints return `{ data|null, error|null, meta }` envelope at the transport level
7. Streaming implemented using Server-Sent Events (SSE) or chunked JSON, covered by tests
8. Rate-limit hooks and per-request timeouts applied within the AI client abstraction

## Integration Verification
IV1. All AI endpoints return the standardized schema
IV2. Circuit breaker/backoff applied; tests verify degraded-mode behavior
IV3. Latency and error metrics captured per AI operation

## Dependencies
- Story 1.1 skeleton and CI in place

## Notes
- Provide feature flag or config toggle to switch AI providers if needed

---
## Dev Agent Record
### Summary
- Implemented unified `AiService` with retry, timeout, rate limiting, SSE streaming, and envelope normalization across controllers.
- Replaced Next.js API routes with proxies that call the service client, ensuring secrets stay in the backend and streaming works end to end, including passthrough SSE for calendars.
- Added DTO validation, shared envelope utilities, and Jest coverage for successful calls, provider failures, rate limiting, timeout handling, and invalid payload rejection.
### Tests
- `npm run lint` (ireal-service)
- `npm run build` (ireal-service)
- `npm run openapi` (ireal-service; temporary env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AI_PROVIDER`, `AI_API_KEY`)
- `npm run test` (ireal-service)
### File List
- `ireal-service/package.json`
- `ireal-service/package-lock.json`
- `ireal-service/src/ai/**`
- `ireal-service/src/common/**`
- `ireal-service/src/metrics/**`
- `ireal-service/src/scripts/generate-openapi.ts`
- `ireal_demo/app/api/ai/**`
- `ireal_demo/lib/ai.ts`
- `ireal_demo/lib/service-client.ts`
- `docs/dev-quickstart.md`
- `docs/api/openapi.yaml`

