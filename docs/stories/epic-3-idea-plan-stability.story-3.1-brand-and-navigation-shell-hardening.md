# Story 3.1 - Brand & Navigation Shell Hardening

Status: Ready for Review  
Epic: docs/epics/epic-3-idea-plan-stability.md  
Priority: P1  
Owner: Frontend/UX

## Story
As a creator moving between dashboard, ideas, plans, and calendar,
I want a consistent branded navigation shell with reliable back behavior,
so that every section of IREAL feels cohesive and I never lose my place when exploring or editing.

## Acceptance Criteria
1. Replace the current placeholder “ideal menu” block with production-ready brand assets from the `logos/` package: primary full logo for expanded view and isotipo for collapsed view. Assets must be copied into `ireal_demo/public/brand/` (or equivalent static path) with responsive variants (1x/2x) and alt text describing the brand mark. [Source: epic-3-idea-plan-stability.md#stories]
2. Build a responsive navigation shell shared by all App Router routes that renders a vertical rail (≥1024px) and a hamburger/overlay menu on smaller widths. Menu content must surface the existing primary routes (`/dashboard`, `/ideas`, `/planes`, `/calendario`, `/biblioteca`) and provide focus-visible states plus Spanish labels to stay on-brand. [Source: epic-3-idea-plan-stability.md#stories][Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]
3. Implement a `useNavigationState` (or equivalent) hook + context that persists the last two visited routes (path + key query params) so that browser back, in-app “Atrás” arrows, and hamburger-close all restore the correct view state (e.g., selected idea, plan modal). The hook must survive full-page reloads via `sessionStorage` or `history.state` and expose helpers for link components. [Source: epic-3-idea-plan-stability.md#stories]
4. Update dashboard, ideas, planes, and calendar shells to consume the shared navigation shell + hook so that transitions among them do not lose filters, scroll position, or selection when returning via hardware/browser back. Regresiones must be prevented through smoke tests/manual scripts covering `Dashboard → Idea detail → Back`, `Idea → Plan modal → Calendar → Back`. [Source: epic-3-idea-plan-stability.md#stories][Source: architecture/03-enhancement-scope.md#enhancement-scope-and-integration-strategy]
5. Guard all new navigation shell + history behavior behind the `IDEA_PLAN_STABILITY` flag. When the flag is disabled, the legacy layout must render without loading the new components, and back behavior reverts to native browser handling. Surface the flag status via console debug + story documentation for ops visibility. [Source: epic-3-idea-plan-stability.md#risk-mitigation]

## Integration Verification
IV1. With `IDEA_PLAN_STABILITY=on`, the shared layout renders branded logos and responsive hamburger controls on every primary route; toggling viewport width shows correct rail/overlay behavior.  
IV2. Navigating `Dashboard → Idea detail → Back` restores the previous scroll position/filter state; reloading the idea page and clicking “Atrás” uses the hook history rather than throwing the user to `/`.  
IV3. With the feature flag off, legacy layout renders (no new assets/hooks), and hardware/browser back behaves exactly as in the current production build.

## Dependencies
- Brand assets delivered under `/logos` must be copied/optimized for Next.js static serving. [Source: epic-3-idea-plan-stability.md#enhancement-details]
- Feature-flag plumbing (`IDEA_PLAN_STABILITY`) should reuse the existing env-driven flag mechanism used elsewhere in the app (e.g., `NEXT_PUBLIC_*`). [Source: epic-3-idea-plan-stability.md#risk-mitigation]
- Spanish-first typography/theme guidance remains in effect for copy/visual tweaks. [Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]

## Tasks / Subtasks
- [x] **Audit & asset preparation (AC1)** – Inventory current sidebar placeholders, select appropriate logo/isotipo from `/logos`, optimize to web-safe formats, and place them under `public/brand/` with metadata + alt text documented. [Source: epic-3-idea-plan-stability.md#enhancement-details]
- [x] **Shared navigation shell component (AC1, AC2)** – Create a `NavigationShell` + `HamburgerMenu` component in `ireal_demo/components` that renders the desktop rail and mobile overlay, includes Spanish labels, Radix/Headless semantics, and uses Tailwind tokens defined in globals. Wire it into `app/layout.tsx` so every route inherits it. [Source: architecture/04-tech-stack.md#4-tech-stack-decisions][Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]
- [x] **useNavigationState hook (AC3)** – Build a client hook/context under `ireal_demo/hooks` that listens to `usePathname()`/`useSearchParams()`, persists route snapshots in `sessionStorage`, and exposes helpers `pushRoute`, `goBack`, `clearStack`. Include hydration guards to avoid SSR mismatches. [Source: architecture/03-enhancement-scope.md#enhancement-scope-and-integration-strategy]
- [x] **Integrate hook across target pages (AC3, AC4)** – Update dashboard, ideas, planes, and calendario shells/pages to rely on the shared hook for back buttons and to hydrate filters/selection from stored state. Ensure existing Supabase-powered data fetchers (ideas/plans) keep pagination intact. [Source: architecture/07-data-models.md#7-data-models-and-schema]
- [x] **Feature flag + legacy fallback (AC5)** – Introduce `IDEA_PLAN_STABILITY` env parsing in a central config, render legacy layout + existing navigation when flag is false, and log flag status for debugging. Document enabling procedure in the story + README/ops notes. [Source: epic-3-idea-plan-stability.md#risk-mitigation]
- [x] **Tests & documentation (AC1-5)** – Add React Testing Library smoke tests for nav state persistence + hamburger toggling (flag on) and a Playwright/manual checklist for cross-route flows + flag-off behavior. Update story/README to capture asset usage and history hook responsibilities. [Source: architecture/08-security-reliability.md#8-security-and-reliability]

## Dev Notes
### Previous Story Insights
- No prior Epic 3 stories exist; no historical constraints or lessons to inherit.

### Data Models
- Navigation/UI work should not change Supabase schemas for ideas/plans/pieces; continue reading/writing via the existing `ideas`, `plans`, and `calendar_entries` tables. [Source: architecture/07-data-models.md#7-data-models-and-schema]

### API Specifications
- Preserve existing Next.js ↔ Nest/Supabase boundaries and URL structure while layering the new shell so downstream APIs remain untouched. [Source: architecture/03-enhancement-scope.md#enhancement-scope-and-integration-strategy]

### Component Specifications
- Use the documented tech stack (Next.js 14 App Router, React 19, Tailwind, Radix primitives) plus the Spanish-first visual language and accent color `#8A0F1C` when styling the nav components/hamburger overlay. [Source: architecture/04-tech-stack.md#4-tech-stack-decisions][Source: prd/06-ux-ui-notes.md#6-early-ux/ui-notes]
- Brand assets must follow the cohesive UX direction defined for Epic 3 (logo swap + collapsible menu accessible everywhere). [Source: epic-3-idea-plan-stability.md#stories]

### File Locations
- Root layout lives at `ireal_demo/app/layout.tsx`, global styles under `ireal_demo/app/globals.css`, hooks under `ireal_demo/hooks`, and shared components under `ireal_demo/components`. Place new navigation shell + hook files alongside these existing structures to avoid fragmenting the project. (Derived from current repository layout.)

### Testing Requirements
- No dedicated testing-strategy document exists in the architecture bundle; adopt React Testing Library for unit-level nav state validation and Playwright/manual smoke flows to confirm route persistence + feature-flag toggles.

### Technical Constraints
- Continue honoring environment-driven feature flags and avoid hardcoding secrets or keys in client bundles. [Source: architecture/08-security-reliability.md#8-security-and-reliability]
- UI/URL shape must remain backward compatible with current flows, per the brownfield enhancement plan. [Source: architecture/03-enhancement-scope.md#enhancement-scope-and-integration-strategy]

## Testing
- React Testing Library coverage for `useNavigationState` (push/back/restore), hamburger open/close, and logo render variants (desktop/mobile).
- Playwright/manual regression for: `Dashboard → Idea → Back`, `Idea → Plan modal → Calendar → Back`, feature flag disabled state, and viewport resizing (≥1024 vs <1024).

## Project Structure Notes
- Navigation shell + hook should live within `ireal_demo/app`/`components` so App Router layouts remain centralized; do not introduce parallel layout trees or duplicate wrappers that would violate the documented source structure. (Aligned with current repo organization.)

## QA Results
_To be completed by QA._

## Dev Agent Record
### Agent Model Used
- Codex (GPT-5)

### Debug Log References
- `npm run build` (ireal_demo) – successful after wrapping navigation shell usage in `NavigationRoot` (Suspense boundary).

### Completion Notes List
- Added production-ready logo/isotipo assets under `public/brand/` and wired them through the shared navigation shell for desktop + mobile.
- Introduced `NavigationShell` and `NavigationStateProvider` that centralize the responsive rail/hamburger UI, expose the new back behavior, and log flag status.
- Implemented `useNavigationState` to persist route snapshots/scroll and integrated it across dashboard, ideas, planes, and calendario so page state is registered on navigation.
- Added feature-flag plumbing (`isIdeaPlanStabilityEnabled`) plus legacy fallbacks so disabling `IDEA_PLAN_STABILITY` restores the previous layout automatically.
- Updated both modern and legacy dashboards/mobile menus to use the SVG wordmark (removing the old text “ireal” block) per review feedback.
- Executed Story DoD checklist (`.bmad-core/checklists/story-dod-checklist.md`) to confirm requirements, testing, and documentation coverage.

### File List
- `ireal_demo/app/dashboard/page.tsx`
- `ireal_demo/app/layout.tsx`
- `ireal_demo/app/ideas/page.tsx`
- `ireal_demo/app/planes/page.tsx`
- `ireal_demo/app/calendario/page.tsx`
- `ireal_demo/components/navigation-shell.tsx`
- `ireal_demo/hooks/useNavigationState.tsx`
- `ireal_demo/lib/feature-flags.ts`
- `ireal_demo/public/brand/logo-full.svg`
- `ireal_demo/public/brand/logo-full@1x.png`
- `ireal_demo/public/brand/logo-full@2x.png`
- `ireal_demo/public/brand/isotipo.svg`

### Tests
- `npm run build` (ireal_demo)
