# Story 1.2 – AI Integration Unification

Status: Draft
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
