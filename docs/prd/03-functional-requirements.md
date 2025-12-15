# 3. Functional Requirements (FRs)

FR-1 Auth & Session
- Protect all non-public routes; session refresh via Supabase or equivalent
- Redirect unauthenticated users to `/auth`; redirect authenticated users away from `/auth` to `/dashboard`

FR-2 Ideas
- Create, read, search, delete ideas; group by recency on UI
- API must validate inputs, paginate, and enforce ownership

FR-3 Plans
- Create plan from idea; manage sections (CRUD, reorder)
- Plan-chat guidance with concise coaching messages; attach/detach plans to ideas

FR-4 Calendar & Autoposting
- AI proposes calendar slots from goals/cadence; user can edit/reschedule (drag/drop, bulk shift)
- Channels: Instagram + TikTok; single linked account (MVP); per-account timezone
- Post types: reels/short-form video and carousels/images (no stories)
- Readiness states on tiles: ready, missing media, token expired, failed retry, published
- Autoposting pulls stored media; if missing, skip/reschedule after user fix
- Publish retries: 3 attempts with backoff (5m/15m/30m); then surface error and mark needs attention

FR-5 Pieces (Assets)
- Upload/list assets associated to plans/pieces with metadata and type validation

FR-5b Publishing Modal
- Unified IG-style modal per post with AI-filled caption/hashtags/cover/time; user can edit time/content
- Channel-specific fields in one modal; reuse asset library; show readiness warnings (missing media/token)

FR-6 AI Integration
- Provide endpoints for generate, nudge, plan-chat, and calendar with unified schema:
  - `{ id, type, content, metadata: { tokens, model, latencyMs }, timestamp }`
- Support streaming for long responses (where applicable)

FR-7 Backend Decoupling
- Introduce a service layer/API separate from Next app for domain logic and data access
- Define versioned REST endpoints (`/v1`) and DTO validation at the service layer

FR-8 Observability & Admin
- Structured logs (request id, user id hash, route, status, latency)
- Minimal health/metrics endpoints; error reporting channel
