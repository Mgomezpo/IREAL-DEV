# Notes + Plan + AI overview (IREAL-DEV)

- **Autosave**: The idea editor (`app/ideas/[id]/page.tsx`) uses `useAutosaveNote` (hooks/useAutosaveNote.ts) to debounce saves (~1s), flush on navigation/unmount, and show “Guardando…/Todos los cambios guardados”.
- **Grouping**: `lib/notes.ts` groups notes by date (Today/Yesterday/Last 7 days/Last 30 days/Older) without empty buckets. `NotesList` renders these sections iOS-style.
- **Link to plans**: The join table `ideas_plans` links notes (ideas) to plans. Fetch notes for a plan via `GET /v1/ideas/by-plan/:planId` (service) or `/api/plans/:id/ideas` (Next.js proxy). Link/unlink via `POST /v1/ideas/:id/attach-plans`.
- **AI prompt**: `buildPlanAIPrompt` (ireal-service/src/ai/ai.service.ts) combines structured Plan data and linked notes into sections and asks for Diagnosis, Strategy, Execution Plan.
- **AI endpoint**: `POST /v1/plans/:planId/generate-strategy` fetches plan + linked notes, builds the prompt, calls Gemini, and returns `{ diagnosis, strategy, executionPlan, raw }`. Frontend proxy: `/api/plans/:id/generate-strategy`.
