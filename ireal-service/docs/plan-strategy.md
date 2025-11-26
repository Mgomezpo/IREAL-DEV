# Plan strategy generation endpoint

- Endpoint: `POST /v1/plans/:planId/generate-strategy`
- Auth: requires `x-user-id` header (same as other plan endpoints).
- Behavior:
  1. Fetches the plan (ownership-checked).
  2. Fetches linked notes via `ideas_plans`.
  3. Builds the AI prompt with `buildPlanAIPrompt(plan, notes)`.
  4. Calls Gemini (plan_assist operation) and returns a JSON payload:
     ```json
     { "diagnosis": "...", "strategy": "...", "executionPlan": "...", "raw": "<llm-output>" }
     ```

## Frontend call example
```ts
const res = await fetch(`/api/plans/${planId}/generate-strategy`, { method: 'POST' });
const data = await res.json();
console.log(data.diagnosis, data.strategy, data.executionPlan);
```
