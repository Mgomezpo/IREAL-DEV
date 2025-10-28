# Story 1.3 – Rate Limiting and Validation

Status: Draft
Epic: docs/epics/epic-backend-decoupling.md

## Story
As an operator,
I want per-user/IP rate limits and payload validation with standardized errors,
so that abuse is mitigated and failures are clear and actionable.

## Acceptance Criteria
1. Per-user and per-IP rate limits on AI and write endpoints (configurable thresholds)
2. DTO/Zod validation on all public payloads with clear 400 responses
3. Standardized error envelope across routes with error code taxonomy
4. Default thresholds documented (e.g., AI: 5 req/min/user; writes: 60 req/min/user) and configurable via env
5. Tests cover 429 responses and validation failure cases

## Integration Verification
IV1. Limits enforced; 429 behavior consistent and logged
IV2. Invalid payloads rejected with 400 + details; logs include correlation id
IV3. Error responses match envelope; docs updated

## Dependencies
- Story 1.1 (skeleton) and 1.2 (AI client) completed

---
