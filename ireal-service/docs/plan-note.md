# Plan ↔ Note (Idea) relationship

We store links between ideas (notes) and plans in the join table `ideas_plans`. A note can be linked to multiple plans, and a plan can hold multiple notes.

## Data flow

- To link a note to plans: `POST /v1/ideas/:id/attach-plans` with `{ "planIds": ["plan-123"] }` (existing endpoint). It replaces existing links for that note.
- To fetch notes for a plan: `GET /v1/ideas/by-plan/:planId` (new).
- Client proxy: `GET /api/plans/:id/ideas` (Next.js) forwards to the service when `IDEAS_SERVICE_ENABLED=true`, or performs a local Supabase join otherwise.

## Consistency

- Linking is validated against user ownership of both the idea and the plans.
- Fetch-by-plan uses the join to return the latest note data, sorted client-side as needed.

## Extend

- If you need single-link semantics (only one plan per note), call `attach-plans` with a single-element array.
- To unlink a note from all plans, call `attach-plans` with an empty array.
