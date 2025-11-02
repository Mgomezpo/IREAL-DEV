# Story 1.6 – Migrate Plans and Sections

Status: Ready for Review
Epic: docs/epics/epic-backend-decoupling.md

## Story
As a user,
I can manage plans and sections with consistency,
so that planning is reliable and structured.

## Acceptance Criteria
1. Service hosts plan CRUD with envelope responses: `GET /v1/plans`, `POST /v1/plans`, `GET /v1/plans/{planId}`, `PATCH /v1/plans/{planId}`, and `DELETE /v1/plans/{planId}`. Each request enforces ownership via `x-user-id`, emits `{ data|null, error|null, meta }`, and persists `status` in the enum `{draft, active, archived}`.
2. Sections move to the service with ownership + validation via endpoints: `POST /v1/plans/{planId}/sections`, `PATCH /v1/plans/{planId}/sections/{sectionId}`, `DELETE /v1/plans/{planId}/sections/{sectionId}`, and `GET /v1/plans/{planId}/sections`. Section DTO = `{ id, planId, title, content, order, createdAt, updatedAt }`.
3. Add `POST /v1/plans/{planId}/sections:reorder` that accepts `{ sectionIds: string[] }`, requires the array to match the plan’s existing section IDs one-to-one, is idempotent, and returns the reordered list (same DTO as in AC2, sorted by new order).
4. Provide `POST /v1/plans/{planId}/ideas:attach` (or equivalent) so plans can link ideas using the same envelope + validation rules introduced in Story 1.5. Reject idea IDs outside the caller’s ownership and sync `ideas_plans`.
5. Next.js `/api/plans/*` and `/api/plans/[id]/sections/*` routes proxy to the new service endpoints behind `PLANS_SERVICE_ENABLED` (default false) with parity to the existing experience.
6. Update plan DTO/validators (service + Next client types) to reference the shared schemas, ensuring status enum, timestamps, and optional description fields stay consistent. Surface OpenAPI specs + `.d.ts` updates.
7. `/v1/ai/plan-chat` remains the single path for plan guidance: ensure plan CRUD updates trigger the unified `AiService` (Story 1.2), capturing metadata (`model`, `tokens`, `latencyMs`, `planId`) per request.

## Integration Verification
IV1. Plan and section UI flows (list, edit, reorder, archive) work unchanged against the service flag ON/OFF.  
IV2. Section reorder keeps persistent order across refreshes and rejects mismatched ID payloads.  
IV3. `plan-chat` invocations appear in metrics/logs with the plan metadata attached (no null plan IDs).  
IV4. Idea⇄plan linking verified from both the Plans detail page and Ideas screen.  
IV5. Regression covers migrations: existing plans/sections migrate without data loss.

## Dependencies
- Stories 1.1-1.5 completed  
- Updated OpenAPI (`docs/api/openapi.yaml`) and architecture views (`docs/architecture/`)  
- Frontend proxy alignment referenced in Story 1.2’s AI client notes

---

## Dev Agent Record
### Summary
- Added NestJS plans module with Supabase-backed service, controller, DTOs, and tests covering plan CRUD, section management/reorder, and idea attachments with ownership validation.
- Extended Supabase types, refreshed OpenAPI + architecture docs, and wired `PLANS_SERVICE_ENABLED` flag guidance so local envs can exercise the new endpoints.
- Replaced Next.js `/api/plans/*` handlers with service-aware proxies (including `ideas:attach`) while preserving Supabase fallbacks and progress calculations.
### Tests
- `npm run lint` (ireal-service)
- `npm run test` (ireal-service)
- `npm run build` (ireal-service)
- `npm run openapi` (ireal-service; temporary stub env vars for Supabase + AI config)
- `npm run lint` (ireal_demo) — not run (Next CLI unavailable locally; install dependencies before retrying)
### File List
- `ireal-service/src/plans/**`
- `ireal-service/src/common/supabase/supabase.types.ts`
- `ireal-service/package.json`
- `ireal_demo/app/api/plans/**`
- `ireal_demo/app/api/plans/[id]/ideas/attach/route.ts`
- `ireal_demo/app/api/ideas/**`
- `docs/dev-quickstart.md`
- `docs/architecture.md`
- `docs/architecture/06-api-design.md`
- `docs/api/openapi.yaml`
