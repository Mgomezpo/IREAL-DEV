# Story 3.3 - Plan Builder & NA8 Workflow Revival

Status: Draft  
Epic: docs/epics/epic-3-idea-plan-stability.md  
Priority: P1  
Owner: Backend/AI

## Story
As a creator generating content plans,
I want the plan builder to produce short-form NA8 strategies reliably from my ideas,
so that I can create TikTok/Instagram calendars without errors or manual rebuilding.

## Acceptance Criteria
1. **Plan API reliability:** Fix the existing `POST /v1/plans` (and proxy `/app/api/plans`) so it no longer returns `"Error al crear el plan"`; enforce DTO validation, surface structured `{ data, error, meta }` responses, and log failures with requestId + ideaId. [Source: epic-3-idea-plan-stability.md#stories][Source: architecture/06-api-design.md#representative-endpoints]
2. **NA8 prompt ingestion:** Load the `IREAL mvp plan (8).json` NA8 workflow at startup (service + Next.js client) and expose it through a typed helper that feeds Google Gemini + OpenAI requests. Missing/corrupt JSON should raise a clear 500 with actionable copy for support. [Source: epic-3-idea-plan-stability.md#enhancement-details]
3. **Plan generation pipeline:** Update the plan builder UI + API route to orchestrate the NA8 steps (route selection, pillars, ideas, recommendations) using Gemini first, then fallback to OpenAI if Gemini fails. Persist the structured output (metadata + sections) into Supabase `plans` + `plan_sections`, and store the raw plan JSON for future calendar generation. [Source: epic-3-idea-plan-stability.md#stories][Source: architecture/07-data-models.md#7-data-models-and-schema]
4. **Plan reader UI:** Render the generated plan within the app (accordion/sections) so users can read the document without leaving the workspace, with status badges indicating success/error of the generation job. [Source: epic-3-idea-plan-stability.md#stories][Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]
5. **Calendar sync:** Immediately make new plans available to the calendar module by emitting plan metadata (id, channels, cadence) through the existing Supabase channel used by `CalendarEntries`; QA should confirm plans appear in the plan connector modal (Story 3.2) within 5 seconds. [Source: epic-3-idea-plan-stability.md#stories][Source: architecture/07-data-models.md#schema-integration]
6. **Observability & feature flag:** Wrap the revamped plan builder under the `IDEA_PLAN_STABILITY` flag, emit telemetry (start, success, failure) with requestId/model info, and provide a documented rollback to the legacy prompt. [Source: epic-3-idea-plan-stability.md#risk-mitigation][Source: architecture/08-security-reliability.md#security-and-reliability]

## Integration Verification
IV1. Creating a plan from an idea returns 200 with populated plan + sections, no `"Error al crear el plan"` toast.  
IV2. Killing the Gemini request triggers the OpenAI fallback and still returns a plan; if both fail, the error message contains requestId + support guidance.  
IV3. Generated plan is viewable inside the app with NA8 structure (route, audience, pillars, ideas, recommendations).  
IV4. Newly created plan appears in the plan connector modal and calendar selection within 5 seconds thanks to Supabase updates.  
IV5. With `IDEA_PLAN_STABILITY` off, legacy prompt executes and telemetry clearly logs that the new pipeline is disabled.

## Dependencies
- Stories 3.1 and 3.2 deliver the feature flag, shared nav, and plan connector UI that will consume the revived plan data. [Source: epic-3-idea-plan-stability.md#stories]
- `IREAL mvp plan (8).json` resides at the repo root; ensure the service has filesystem access or embed it at build time. [Source: workspace file list]
- Existing Supabase tables (`plans`, `plan_sections`, `calendar_runs`) must remain backward compatible; extend rather than modify columns. [Source: architecture/07-data-models.md#7-data-models-and-schema]

## Tasks / Subtasks
- [ ] **API hardening (AC1)** – Audit the plan creation service/controller to ensure DTO validation and descriptive error codes; update Next.js proxy to relay structured errors and remove the generic Spanish toast. [Source: architecture/06-api-design.md#representative-endpoints]
- [ ] **NA8 config loader (AC2)** – Implement a config module (shared between service + client) that loads/parses `IREAL mvp plan (8).json`, validates schema, caches it, and exposes typed accessors with sanity checks. [Source: epic-3-idea-plan-stability.md#enhancement-details]
- [ ] **Prompt orchestration (AC3)** – Refactor the plan builder API route to call Gemini with the NA8 prompt sections; on failure, retry with OpenAI. Capture route selection, pillars, ideas, recommendations, and metadata (tokens, latency). [Source: architecture/06-api-design.md#representative-endpoints]
- [ ] **Persistence layer (AC3)** – Map NA8 output to Supabase `plans` + `plan_sections` records, storing the raw JSON and linking to the source idea. Guarantee transactional integrity (all-or-nothing save). [Source: architecture/07-data-models.md#7-data-models-and-schema]
- [ ] **Plan reader UI (AC4)** – Update the plan detail page (`ireal_demo/app/planes/[id]/page.tsx`) to render the NA8 sections with Spanish copy, status badges, and empty-state messaging when generation fails. [Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]
- [ ] **Calendar broadcast (AC5)** – Publish a Supabase channel/event or shared cache update so the plan connector + calendar subscribe to newly created plans. Document the payload shape and ensure real-time updates occur within seconds. [Source: architecture/07-data-models.md#schema-integration]
- [ ] **Flag + telemetry (AC6)** – Gate all new code behind `IDEA_PLAN_STABILITY`, log start/success/failure events with requestId/model names, and document the steps for reverting to the legacy prompt if telemetry signals issues. [Source: epic-3-idea-plan-stability.md#risk-mitigation]
- [ ] **Testing & docs (AC1-6)** – Add Jest/unit tests for config loader + prompt orchestrator, integration tests for plan creation/fallback, and manual/Playwright scripts verifying UI + calendar sync. Update README/ops runbook with NA8 handling + rollback details. [Source: architecture/08-security-reliability.md#security-and-reliability]

## Dev Notes
### Previous Story Insights
- Story 3.1 delivered the feature flag + navigation shell; Story 3.2 built the plan connector that depends on real-time plan availability. This story must feed that connector and respect the same flag. [Source: docs/stories/epic-3-idea-plan-stability.story-3.1-..., story-3.2-...]

### Data Models
- Plans: `id, user_id, idea_id?, title, status, created_at, updated_at, summary`. PlanSections: `id, plan_id, order, title, body`. CalendarEntries require `plan_id` metadata. Ensure plan metadata includes channels/cadence for calendar ingestion; add additive columns if needed. [Source: architecture/07-data-models.md#7-data-models-and-schema]

### API Specifications
- Use `POST /v1/plans`, `POST /v1/ideas/{id}/plans:attach`, and `/v1/ai/*` endpoints, preserving the `{ data, error, meta }` envelope and Supabase auth context. Errors must include `code`, `message`, `requestId`. [Source: architecture/06-api-design.md#representative-endpoints]

### Component Specifications
- The UI remains Spanish-first with the calm notebook theme; plan reader should reuse Tailwind + Radix components consistent with existing pages. [Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]
- Plan builder form lives under `ireal_demo/app/planes/new/page.tsx` and associated components; updates must be additive, not a redesign.

### File Locations
- Backend logic: `ireal-service/src/plans` (or `ai` module if prompt-driven) plus Next.js proxy at `ireal_demo/app/api/plans/route.ts`.  
- Frontend plan builder/reader: `ireal_demo/app/planes/new/page.tsx`, `ireal_demo/app/planes/[id]/page.tsx`, shared components under `ireal_demo/components`. Config for NA8 loader can live under `ireal_service/src/config` and `ireal_demo/lib/na8-plan-schema.ts`.

### Testing Requirements
- No dedicated testing-strategy doc is available; follow architecture guidance: Jest/unit for DTO + prompt orchestration, integration tests for service endpoints, and manual/Playwright tests validating UI + calendar sync. [Source: architecture/08-security-reliability.md#security-and-reliability]

### Technical Constraints
- Do not embed secrets in client bundles; load API keys server-side in the service. Handle retries with jitter per architecture guidance. Ensure fallback to legacy prompt is a simple flag flip to avoid downtime. [Source: architecture/08-security-reliability.md#security-and-reliability]

## Testing
- Jest/unit: NA8 config parser, prompt orchestration (Gemini success/OpenAI fallback), persistence mapper.  
- Integration: `POST /v1/plans` success, fallback, validation error, calendar broadcast.  
- Playwright/manual: Create plan from idea, view plan document, confirm plan appears in connector + calendar, verify flag-off behavior.

## Project Structure Notes
- Keep backend updates within `ireal-service/src` modules defined in the architecture source tree; do not introduce new services. Frontend changes belong under the existing App Router folders to preserve structure.

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-11-19 | 0.1 | Initial draft of Story 3.3. | Bob (Scrum Master) |

## QA Results
_To be completed by QA._

## Dev Agent Record
_To be completed by the assigned Dev agent._
