# Epic 3 - Idea & Plan Experience Stabilization (Brownfield Enhancement)

Status: Draft  
Owner: PM  
Goal: Rebuild the critical UX/data flows for ideas and plans so creators can reliably ideate, connect plans, and keep navigation consistent while reintroducing brand assets.

## Project Analysis Snapshot
- [x] Current functionality: Next.js 14 (App Router) + Supabase powering Ideas �� Plans �� Calendar for AI-assisted content workflows.
- [x] Tech stack: React 19 + Tailwind v4 frontend, Radix UI primitives, Supabase Postgres, Google Generative AI prompts via SDK/REST.
- [x] Integration points: Idea list/dashboard views, plan creation API (`/api/plans`), calendar data binding, Supabase tables for ideas/plans/calendar, shared auth/session middleware.
- [x] Enhancement scope: UX alignment + reliability fixes centered on navigation, idea workspace, and plan builder flows (≤3 stories).
- [x] Success criteria: Stable brand/navigation shell, consistent idea data across dashboard/workspace, functional plan creation using N8n template with observable persistence.

## Epic Goal
Deliver a cohesive UX (logo placement + responsive nav), make the idea workspace trustworthy (filters, persistence, plan linking), and resurrect the plan creation pipeline so creators can build N8n-based short-form calendars without backend errors.

## Epic Description

**Existing System Context**
- Current relevant functionality: Dashboard lists recent ideas/notes, idea workspace allows CRUD and linking to plans, plan builder should emit calendar-ready artifacts, and back navigation relies on browser history events.
- Technology stack: Mono Next.js 14 app with React 19 client components, Supabase Postgres tables (`ideas`, `plan_templates`, `plans`, `calendar_entries`), and Google GenAI prompts invoked in `/api/ideas` and `/api/plans`.
- Integration points: New UX shell must wrap existing layouts, idea save/delete routes feed Supabase via server actions, plan builder consumes N8n prompts from `IREAL mvp plan (8).json` (user-provided ideal-mbp-plan JSON), calendar view expects plan metadata for scheduling.

**Enhancement Details**
- What's being added/changed:
  - Replace placeholder left menu visual with assets from `logos/` and introduce a persistent collapsible hamburger navigation that works across all routes.
  - Normalize browser/navigation handling so the back button and in-app history restore consistent view state (dashboard �� idea detail �� plan pop-up).
  - Fix idea filters (month/year/day mini-calendar) and ensure dashboard cards render the same Supabase rows as the idea list.
  - Ensure unsaved body text is persisted (auto-draft) even when the title is empty, provide a confirmation modal for deletions, and wire the "connect plan" action to a 2x3 modal grid with plan cards + "+ Create plan".
  - Repair plan loading/creation errors, rebuild prompts around N8n short-form structure from `IREAL mvp plan (8).json`, persist generated plans, and expose them in the modal grid plus calendar handoff.
- How it integrates:
  - Uses existing Next.js layouts and Supabase actions; new nav shell sits atop current components.
  - Idea filters query the same Supabase view used by dashboard; plan connector pulls from `/api/plans`.
  - Plan creation uses the N8n prompt JSON to orchestrate steps, then stores structured output for calendar consumption.
- Success criteria:
  - Navigation consistent everywhere, with branded logo assets visible and accessible controls on desktop/mobile.
  - Idea backlog parity between dashboard and detail view, with working filters and autosave/back navigation.
  - Plan modals show existing plans and allow new plan creation without triggering "Error al cargar/crear plan".
  - Generated plans follow N8n short-form format and are immediately attachable to calendars.

## Stories
1. **Story 3.1 – Brand & Navigation Shell Hardening**  
   Implement logo swap (from `logos/` assets) and responsive hamburger nav, unify browser/in-app back handling, and ensure layout persistence across app sections.
2. **Story 3.2 – Idea Workspace Reliability & Plan Connector**  
   Ship the calendar filter widget, fix dashboard/data parity, implement autosave & delete confirmation flows, and deliver the 2x3 plan modal (with "+ Create plan") tied to real data.
3. **Story 3.3 – Plan Builder & N8nNA Workflow Revival**  
   Resolve plan API errors, rebuild plan creation around the `IREAL mvp plan (8).json` N8n structure for short-form TikTok/Instagram content, store readable outputs, and sync to calendars.

## Compatibility Requirements
- [ ] Existing APIs remain unchanged (Next.js routes keep current contracts; additions must be additive or behind feature flags).
- [ ] Database schema changes are backward compatible (additive columns/defaults; migrations guard existing data).
- [ ] UI changes follow established Next.js + Tailwind patterns (Radix primitives where applicable).
- [ ] Performance impact is minimal (navigation/menu JS kept lightweight; filters paginate Supabase queries).

## Risk Mitigation
- **Primary Risk:** Breaking existing navigation/history resulting in blank screens.  
  **Mitigation:** Implement centralized `useNavigationState` hook with regression tests plus feature flag.
- **Risk:** Plan builder prompt misalignment without the N8n JSON reference.  
  **Mitigation:** Validate JSON presence at build/startup; add fallback copy + monitoring for missing data.
- **Risk:** Data inconsistency between dashboard and idea list persists.  
  **Mitigation:** Use shared Supabase RPC/view; add contract tests ensuring identical filters/sorting.
- **Rollback Plan:** Wrap all UI/data changes behind `IDEA_PLAN_STABILITY` flag. To rollback, disable flag to restore prior layouts/API behavior; database additions remain additive so no destructive rollback needed.

## Definition of Done
- [ ] Logo + navigation shell deployed with responsive + accessible controls.
- [ ] Browser and in-app back navigation keep view state without JS errors.
- [ ] Idea filters, autosave, delete confirmation, and plan modal all function against Supabase.
- [ ] Plan load/create endpoints succeed and emit N8n-formatted documents viewable in-app.
- [ ] Calendar can immediately reference the newly created plan metadata.
- [ ] QA validates legacy functionality (dashboard, existing ideas/plans) shows no regression.
- [ ] Docs (README/ops notes) mention new flag, assets, and N8n prompt handling.

## Validation Checklist
- [ ] Epic fits within 3 stories; no architectural rework required.
- [ ] Enhancement follows existing Next.js + Supabase patterns.
- [ ] Integration complexity limited to UI + API fixes already hosted in app.
- [ ] Rollback/feature flags specified and feasible.
- [ ] Dependencies (logos assets, `IREAL mvp plan (8).json`) identified and owned.

## Story Manager Handoff
"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to the existing Next.js 14 + Supabase stack (React 19 client, server actions backed by Supabase).
- Integration points: idea dashboard/list views (`ideas` table & Supabase RPC), plan APIs (`/api/plans`, `plan_templates`), calendar binding, brand assets from `logos/`, and the `IREAL mvp plan (8).json` N8n template file.
- Existing patterns to follow: Tailwind + Radix UI for components, Supabase server actions with optimistic updates, feature-flag-driven rollouts.
- Critical compatibility requirements: keep API contracts stable, add-only schema changes, maintain performance of idea lists.
- Each story must include verification that dashboard, idea CRUD, and plan builder flows still honor existing saved content and that the N8n plan output is available to the calendar."
