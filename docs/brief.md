# Project Brief: IREAL

- Version: v0.2 (updated for service split)
- Source Inputs:
  - Old docs: `old_PRDs_&_Docs/ireal_flujo_0_landing_auth_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_1_dashboard_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_2_ideas_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_3_planes_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_4_calendario_detallado.md`, `old_PRDs_&_Docs/ireal_guia_de_estilo_ux_ui_v_1.md`, `old_PRDs_&_Docs/Ireal Brand Brief (2-Oct-2025).pdf`
  - Current code: `ireal_demo` (Next.js 14 app with Supabase SSR) + `ireal-service` (NestJS backend). Env wiring in `ireal_demo/.env.local` and `ireal-service/.env`.

## Executive Summary

IREAL is a creative workspace that orchestrates AI to help content creators move from ideation to planned publishing with a frictionless, delightful UX. It bridges scattered tools and the end-to-end creative flow: capturing ideas, shaping plans, scheduling, and producing assets with AI assistance. Target market: individual creators and small creative teams producing social/video/podcast/blog content. Key value: integrated flow plus assistive AI across ideation, planning, and scheduling, wrapped in a cohesive, calm, notebook-like UX.

## Problem Statement

- Creators juggle disparate tools (notes, docs, calendars, AI chats) with high context-switching and inconsistent output quality.
- Impact: lost ideas, ad-hoc planning, underutilized backlogs, missed cadence; time drain and unpredictable content quality.
- Existing solutions excel at a slice (notes, PM, calendars, AI chat) but do not provide a unified creative operating system.
- The rise of AI and short-form content cadence makes a streamlined, reliable, AI-assisted workflow urgent.

## Proposed Solution

- A single workspace where creators capture and curate ideas, chat with AI to shape strategy, turn ideas into plans, schedule on a calendar, and manage reusable content pieces.
- Use focused AI endpoints for planning nudges, calendar generation, and plan-structured guidance (proxied from the frontend to the Nest service via `callService` and `IREAL_SERVICE_URL`).
- Differentiators: opinionated creative flow, Spanish-first support, frictionless navigation, and plan-centric AI guidance (short, strategic prompts).
- Vision: an extensible creative OS with templates, reusable assets, and collaborative features, backed by reliable AI and robust data foundations.

## Target Users

### Primary: Independent content creators

- Behaviors: capture ideas on the fly; publish weekly/daily; remix across channels.
- Needs: structure without friction, fast planning help, reliable scheduling, easy asset reuse.
- Goals: consistent cadence, creative focus, audience growth.

### Secondary: Small creative teams/agencies

- Needs: collaboration, shared templates, review gates, role-based access.
- Goals: repeatable processes, brand consistency, throughput and reliability.

## Goals & Success Metrics

### Business Objectives

- 30% week-4 retention for active creators (>= 3 sessions/week).
- 40% of new users complete first plan within 48 hours.
- 25% increase in scheduled posts per active user after 2 weeks.

### User Success Metrics

- Time-to-first-plan < 15 minutes; time-to-first-calendar < 10 minutes.
- >= 80% users rate AI suggestions as useful or very useful.

### KPIs

- Activation: First plan created; First calendar generated.
- Throughput: Ideas captured/week; Plans published/month.
- Reliability: API p95 < 300ms (non-AI), successful AI responses > 99%.
- Safety: 0 leaked API keys; auth-protected route coverage 100%.

## MVP Scope

### Core Features (Must Have)

- Auth + protected app shell with dashboard and navigation (exists: `ireal_demo/middleware.ts`, `lib/supabase/*`).
- Ideas: capture, search, group by recency, delete (exists: `app/ideas/page.tsx`; API now proxies to `ireal-service` when `IDEAS_SERVICE_ENABLED=true`, with Supabase fallback otherwise).
- Plans: create, section management, reorder, attach to ideas (frontend proxies to service; `PLANS_SERVICE_ENABLED` flag controls proxy).
- Calendar: generate AI-assisted schedules and manage events (`/app/api/ai/calendar` proxies to service).
- AI Assist: generate, nudge, plan-chat, plan-assist (frontend proxies to service AI endpoints).
- Biblioteca/Pieces: assets and attachments (frontend proxy to service `v1/pieces`).

### Out of Scope (for MVP)

- Multi-tenant org admin, advanced RBAC/approvals, third-party calendar sync, mobile apps, real-time collaboration.

### MVP Success Criteria

- New user completes: login -> idea capture -> plan generated -> calendar drafted in one session without errors.
- AI endpoints stable (no leaked keys, consistent responses); observability in place; data persisted.

## Post-MVP Vision

### Phase 2 Features

- Team collaboration, shared templates, review flows, content versioning, publishing integrations.

### Long-term Vision

- Full creative OS: reusable building blocks, multi-channel publishing, analytics feedback loops, advanced personalization.

### Expansion Opportunities

- Template marketplace; integrations (Google Calendar, Notion, YouTube Studio, IG/FB Graph APIs); insights and recommendations.

## Technical Considerations

### Platform Requirements

- Target: Web app (desktop-first, responsive).
- Browser: Evergreen browsers; accessibility and performance on mid-range devices.
- Performance: p95 < 300ms standard API; AI endpoints stream responses; LCP < 2.5s key pages.

### Current Stack Snapshot

- Frontend: Next.js 14.2.x, React 18.3.x, Tailwind, shadcn-like components; Supabase SSR client for auth/session.
- Backend: NestJS service (`ireal-service`) with modules for AI, ideas, plans, pieces, metrics, health, auth. Env validated via Zod; rate limits via guard; observability module scaffolded.
- Frontend-to-service bridge: `ireal_demo/lib/service-client.ts` proxies to `IREAL_SERVICE_URL` with request IDs; feature flags `IDEAS_SERVICE_ENABLED` and `PLANS_SERVICE_ENABLED` toggle proxy vs direct Supabase fallback.
- Data: Supabase Postgres; service expects `SUPABASE_SERVICE_URL` and service role key.
- Config: Next build currently ignores TypeScript errors (`next.config.mjs`); images are unoptimized.

### Architecture Considerations (Updated)

- Current: Split in practice — frontend uses Next for UI; backend logic is moving into `ireal-service`, with Next API routes acting as thin proxies (fallbacks still present for ideas/plans).
- Target: Keep Next strictly for UI and edge rendering; keep all domain logic in the service. Add Redis for caching/queues and OpenAPI-first contracts for frontend/backend alignment. Maintain observability via OpenTelemetry (logs, metrics, traces).
- Migration plan: Finish parity in service, retire direct Supabase fallbacks, and enforce API gateway routing from the frontend to the service only.

## What Is Outdated or Needs Rethinking

### Security

- AI key is no longer hardcoded in `ireal_demo` (calls proxy to service); ensure secrets stay server-side and not exposed via public envs.

### Consistency

- Mixed AI integrations (SDK vs raw REST) still exist; the service centralizes them but the frontend should consume only the service to keep consistency.

### Reliability

- `next.config.mjs` ignores TypeScript build errors; enable build-time type safety for production.
- Rate limiting exists in the service; align frontend error handling/retries with it and add circuit breakers where needed.

### Observability

- Observability module exists in the service; wire in tracing/metrics/logging end-to-end and surface request IDs from proxies.

### Performance

- AI endpoints stream from the service; add caching for deterministic prompts and time-box long AI calls in the service.

### Compliance

- Clarify data retention for AI prompts/results; PII handling and user export/delete.

## Constraints & Assumptions

### Constraints

- Budget/Timeline/Team: Not specified; assume solo/small team initially.
- Technical: Supabase + Next.js; serverless functions constraints; token quotas for AI.

### Key Assumptions

- Spanish-first UX; creators prioritize simplicity over configurability.
- Supabase roles and storage will satisfy initial needs.
- Vercel deployment target.

### Migration Intent

- Objective: decouple backend logic from Next.js to achieve independent scaling, reliability, and AI task isolation.
- Rationale: Next API routes limit long-running or concurrent AI tasks; separating ensures stability and lower coupling.
- Milestones:
  1. Backend service skeleton (Nest) — completed and wired via proxies.
  2. Auth and data model migration — service expects Supabase service role; finish parity and deprecate direct Supabase access from Next.
  3. AI endpoints moved to backend — implemented in `ireal-service`; ensure frontend uses only service.
  4. Observability baseline (logging + metrics) — module scaffolded; needs full wiring and dashboards.
  5. Deprecate old API routes in Next after service parity and testing.

## Risks & Open Questions

### Key Risks

- API key exposure and quota abuse if not remediated.
- AI provider changes/pricing impacting cost/reliability.
- Scope creep from templates/marketplace before core is robust.

### Open Questions

- Which channels are in-scope for calendar/publishing?
- Required integrations for day-1 (Google Calendar? YouTube?).
- Data model for pieces and cross-channel reuse.

### Research Areas

- Creator workflows by niche; content cadence benchmarks; AI prompt libraries that drive better plans.

## References

- Old flows/style guide: `old_PRDs_&_Docs/*`
- Current code: `ireal_demo/app/*`, `ireal_demo/app/api/*`, `ireal_demo/lib/*`, `ireal-service/src/*`
- PRD: `docs/prd.md`

## Next Steps

1. Security hardening:
   - Keep AI keys strictly in service env; rotate compromised keys; add server-only access guards in service and proxies.
2. Reliability baseline:
   - Enable TypeScript build checks; align proxy error handling with service rate limits; add retries/circuit breakers where safe.
3. Observability:
   - Add structured logs and error reporting for proxies; wire tracing/metrics in `ireal-service` and surface request IDs end-to-end.
4. AI integration unification:
   - Standardize provider client, configs, error handling, and consistent response schema in the service; ensure frontend only calls the service.
5. MVP functional pass:
   - Validate auth -> ideas -> plans -> calendar happy path with test data across proxy + service.
6. PM/PO follow-up:
   - Confirm MVP scope; prioritize Phase 2 items; define integration roadmap.
