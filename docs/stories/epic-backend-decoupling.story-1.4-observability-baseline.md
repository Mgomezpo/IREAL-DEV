# Story 1.4 – Observability Baseline

Status: Ready for Review
Epic: docs/epics/epic-backend-decoupling.md

## Story
As an operator,
I need structured logs, basic metrics, health checks, and an error reporting sink,
so that I can monitor reliability and debug incidents.

## Acceptance Criteria
1. Structured, redacted request/response logging with correlation IDs
2. Metrics for RPS, latency (p50/p95), error rates per route
3. `/healthz` and `/metrics` endpoints operational in service
4. Error reporting sink configured (stub or provider) with sampling
5. Logs include fields: `requestId`, `userIdHash` (if available), `route`, `status`, `latencyMs`
6. Redaction rules strip tokens/PII; error sampling rate (e.g., 10%) documented

## Integration Verification
IV1. Metrics visible and thresholds documented
IV2. Sampled errors visible in sink without PII/secrets
IV3. Logs show correlation across service and Next proxy (if applicable)

## Dependencies
- Stories 1.1–1.3 completed

---
