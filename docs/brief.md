# Project Brief: IREAL

- Version: Draft v0.1
- Source Inputs:
  - Old docs: `old_PRDs_&_Docs/ireal_flujo_0_landing_auth_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_1_dashboard_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_2_ideas_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_3_planes_detallado.md`, `old_PRDs_&_Docs/ireal_flujo_4_calendario_detallado.md`, `old_PRDs_&_Docs/ireal_guia_de_estilo_ux_ui_v_1.md`, `old_PRDs_&_Docs/Ireal Brand Brief (2-Oct-2025).pdf`
  - Codebase: `ireal_demo` (Next.js app, Supabase SSR, AI endpoints)

## Executive Summary

IREAL is a creative workspace that orchestrates AI to help content creators move from ideation to planned publishing with a frictionless, delightful UX. It solves the gap between scattered tools and the end-to-end creative flow: capturing ideas, shaping plans, scheduling, and producing assets with AI assistance. Target market: individual creators and small creative teams producing social/video/podcast/blog content. Key value: integrated flow + assistive AI across ideation, planning, and scheduling, wrapped in a cohesive, calm, “notebook-like” UX.

## Problem Statement

- Creators juggle disparate tools (notes, docs, calendars, AI chats) with high context-switching and inconsistent output quality.
- Impact: lost ideas, ad-hoc planning, underutilized backlogs, missed cadence; time drain and unpredictable content quality.
- Existing solutions excel at a slice (notes, PM, calendars, AI chat) but don’t provide a unified creative operating system.
- The rise of AI and short-form content cadence makes a streamlined, reliable, AI-assisted workflow urgent.

## Proposed Solution

- A single workspace where creators capture and curate ideas, chat with AI to shape strategy, turn ideas into plans, schedule on a calendar, and manage reusable content “pieces.”
- Use focused AI endpoints for planning nudges, calendar generation, and plan-structured guidance.
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

- 30% week-4 retention for active creators (≥3 sessions/week).
- 40% of new users complete “first plan” within 48 hours.
- 25% increase in scheduled posts per active user after 2 weeks.

### User Success Metrics

- Time-to-first-plan < 15 minutes; time-to-first-calendar < 10 minutes.
- ≥80% users rate AI suggestions as “useful” or “very useful.”

### KPIs

- Activation: First plan created; First calendar generated.
- Throughput: Ideas captured/week; Plans published/month.
- Reliability: API p95 < 300ms (non-AI), successful AI responses > 99%.
- Safety: 0 leaked API keys; auth-protected route coverage 100%.

## MVP Scope

### Core Features (Must Have)

- Auth + protected app shell with dashboard and navigation (exists: `ireal_demo/middleware.ts`, `lib/supabase/*`).
- Ideas: capture, search, group by recency, delete (exists: `app/ideas/page.tsx`, `app/api/ideas/*`).
- Plans: create, section management, reorder, attach to ideas (exists: `app/api/plans/[id]/*`, `sections/*`).
- Calendar: generate AI-assisted schedules and manage events (exists: `app/api/ai/calendar`).
- AI Assist: generate, nudge, plan-chat (exists: `app/api/ai/{generate,nudge,plan-chat,plans}`).
- Biblioteca/Pieces: assets and attachments (exists: `app/api/pieces/*`).

### Out of Scope (for MVP)

- Multi-tenant org admin, advanced RBAC/approvals, third-party calendar sync, mobile apps, real-time collaboration.

### MVP Success Criteria

- New user completes: login → idea capture → plan generated → calendar drafted in one session without errors.
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
- Browser: Evergreen browsers; a11y and performance on mid-range devices.
- Performance: p95 < 300ms standard API; AI endpoints stream responses; LCP < 2.5s key pages.

### Technology Preferences (Updated)

- Frontend: Keep Next.js 14 + React 19, Tailwind, shadcn-like components.
- Backend: Move away from Next API routes.
  - Option A: Python FastAPI + SQLAlchemy + Celery (recommended for AI workloads).
  - Option B: Node/NestJS + Prisma + BullMQ (if staying TypeScript).
- Database: Dedicated Postgres instance (can still be Supabase-managed).
- Caching/Queues: Redis.
- Observability: OpenTelemetry stack.
- Infra: Docker, docker-compose, Vercel (UI), Fly.io/Render/AWS (backend).

### Architecture Considerations (Updated)

- Current: Single monorepo Next.js app using Supabase SSR and API routes.
- Target: Split architecture.
  - Keep Next.js strictly for UI (frontend + edge rendering).
  - Move all backend logic (AI endpoints, plans, ideas, calendar, auth/session) into a dedicated service (Python FastAPI or Node/Nest).
  - Introduce a Postgres instance (via Supabase or managed DB) shared via secure API.
  - Add Redis for caching, queues, and rate limits.
  - Adopt OpenAPI-first contract between frontend and backend.
  - Observability via OpenTelemetry (logs, metrics, traces).
  - CI/CD pipelines for both front and backend; Docker-based deploys.
- Migration plan: Incremental service extraction from Next → API gateway routing → deprecate old Next API routes after parity.

## What’s Outdated or Needs Rethinking

### Security

- Hardcoded AI key in `ireal_demo/app/api/ai/generate/route.ts:3` — must use env secrets with server-only access.

### Consistency

- Mixed AI integrations (SDK vs raw REST); unify provider access, error handling, and response shape.

### Reliability

- `next.config.mjs` ignores TS build errors; enable build-time type safety for production.
- No visible rate limiting, retries, or circuit breakers for AI calls.

### Observability

- Limited/no structured logging, tracing, metrics; add basic telemetry.

### Performance

- AI endpoints should stream and time-box; add caching for deterministic prompts.

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
  1. Backend service skeleton (FastAPI/Nest).
  2. Auth & data model migration.
  3. AI endpoints moved to backend.
  4. Observability baseline (logging + metrics).
  5. Deprecate old API routes in Next.

## Risks & Open Questions

### Key Risks

- API key exposure and quota abuse if not remediated.
- AI provider changes/pricing impacting cost/reliability.
- Scope creep from templates/marketplace before core is robust.

### Open Questions

- Which channels are in-scope for calendar/publishing?
- Required integrations for day-1 (Google Calendar? YouTube?).
- Data model for “pieces” and cross-channel reuse.

### Research Areas

- Creator workflows by niche; content cadence benchmarks; AI prompt libraries that drive better plans.

## References

- Old flows/style guide: `old_PRDs_&_Docs/*`
- Codebase modules: `ireal_demo/app/*`, `ireal_demo/app/api/*`, `ireal_demo/lib/supabase/*`

## Next Steps

1. Security hardening:
   - Move AI keys to env; rotate compromised keys; add server-only access guards.
2. Reliability baseline:
   - Enable TypeScript build checks; add basic request validation, rate limiting, retries.
3. Observability:
   - Add structured logs and error reporting for API routes; minimal tracing.
4. AI integration unification:
   - Standardize provider client, configs, error handling, and consistent response schema.
5. MVP functional pass:
   - Validate auth → ideas → plans → calendar happy path with test data.
6. PM/PO follow-up:
   - Confirm MVP scope; prioritize Phase 2 items; define integration roadmap.

