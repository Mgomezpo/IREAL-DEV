# 1. Intro Project Analysis and Context

## Analysis Source
- IDE-based fresh analysis using `docs/brief.md` and the `ireal_demo` codebase

## Current Project State
- App: Next.js 14 (App Router), React 19, TS, Tailwind v4, Radix UI
- Auth/DB: Supabase SSR client (`lib/supabase/*`) with middleware route protection
- Domains and APIs:
  - AI: `/app/api/ai/{generate,plan-chat,plans,calendar,nudge}` (mixed SDK/REST usage)
  - Ideas: `/app/api/ideas/*` (list, search, delete; idea detail)
  - Plans: `/app/api/plans/[id]/*` (sections, reorder, section CRUD)
  - Pieces: `/app/api/pieces/[id]/*` (assets upload/listing)
- UX: Spanish-first, notebook theme, flows for auth, ideas, plans, calendar, biblioteca per old UX docs
- Notable issues: hardcoded AI key in `app/api/ai/generate/route.ts`; TS build errors ignored in `next.config.mjs`; no explicit rate limiting/observability

## Available Documentation
- Project Brief: `docs/brief.md`
- Old UX/flows: `old_PRDs_&_Docs/*` (landing/auth, dashboard, ideas, planes, calendario, UX style guide PDF/MD)
- Source tree and tech stack are implicit from repo; no formal API spec yet
