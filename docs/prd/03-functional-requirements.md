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

FR-4 Calendar
- AI-assisted calendar generation from goals and cadence inputs
- Persist schedules; allow user edits and regeneration by constraints

FR-5 Pieces (Assets)
- Upload/list assets associated to plans/pieces with metadata and type validation

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

