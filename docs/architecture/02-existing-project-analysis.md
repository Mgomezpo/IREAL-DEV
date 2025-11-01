# 2. Existing Project Analysis

- Primary Purpose: AI-assisted creative workflow for content creators (ideas → plans → calendar → assets)
- Current Tech Stack: Next.js 14 (App Router), React 19, TypeScript, Tailwind v4, Radix UI; Supabase SSR for auth/session; Google Generative AI via SDK and raw REST
- Architecture Style: Monolithic web app with embedded API routes per domain
- Deployment: Likely Vercel for frontend; serverless Next API routes
- Constraints / Issues:
  - Hardcoded AI key in `app/api/ai/generate/route.ts`
  - `next.config.mjs` ignores TypeScript build errors
  - No explicit rate limiting, retries/circuit breaker, or structured telemetry

Validation: Based on the code and docs above, please confirm these observations match your environment.
