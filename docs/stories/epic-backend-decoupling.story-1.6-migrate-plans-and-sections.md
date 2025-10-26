# Story 1.6 – Migrate Plans and Sections

Status: Draft
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a user,
I can manage plans and sections with consistency,
so that planning is reliable and structured.

## Acceptance Criteria
1. `/v1/plans` CRUD and `PATCH /v1/plans/{id}`
2. Sections CRUD + reorder endpoints; attach plan to idea
3. DTOs standardized; plan-chat endpoints call unified AI client

## Integration Verification
IV1. UI flows unchanged; regression pass on plan screens
IV2. Section reorder stable; no data loss
IV3. AI prompts recorded according to metadata policy

## Dependencies
- Stories 1.1–1.5 completed

---

