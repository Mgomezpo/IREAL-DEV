# 6. API Design and Integration

- **Strategy:** Versioned `/v1` REST with standardized envelope and error handling; DTO/class-validator everywhere
- **Authentication:** Forward Supabase user/session context; enforce ownership at service boundaries
- **Versioning:** Start with `/v1`; maintain backward-compatible changes during migration

### Representative Endpoints
- Ideas: `GET/POST /v1/ideas`, `GET/DELETE /v1/ideas/{id}`, `POST /v1/ideas/{id}/plans:attach`
- Plans: `GET/POST /v1/plans`, `GET/PATCH/DELETE /v1/plans/{id}`, sections CRUD (`POST /v1/plans/{id}/sections`, `PATCH/DELETE /v1/plans/{id}/sections/{sectionId}`), `POST /v1/plans/{id}/sections:reorder`, and `POST /v1/plans/{id}/ideas:attach`
- AI/Calendar: `POST /v1/ai/calendar` (SSE chunked stream with keep-alive heartbeats + final summary/done meta), `POST /v1/ai/calendar/save` (persist manual edits), `GET /v1/ai/calendar/{calendarId}` (reload saved entries). All calendar operations persist runs/entries to Supabase for diffable history.
- Accounts: `POST /v1/accounts/ig/link`, `POST /v1/accounts/tiktok/link`, `GET /v1/accounts` (per-user), `DELETE /v1/accounts/{id}`; returns readiness (token status, timezone).
- Calendar entries: `GET /v1/calendar/entries`, `PATCH /v1/calendar/entries/{id}` (reschedule, update readiness), bulk shift endpoint (offset), `POST /v1/calendar/entries/{id}:publish-now` (if API allows).
- Publishing: `POST /v1/publishing/jobs` (create from calendar entry), `PATCH /v1/publishing/jobs/{id}` (reschedule/cancel), `POST /v1/publishing/jobs/{id}:retry`, `GET /v1/publishing/jobs` (status); webhook/callback endpoints if platform provides.
- Health/Metrics: `GET /healthz`, `GET /metrics`

### Response Envelope
```json
{
  "data": { /* payload */ },
  "error": null,
  "meta": { "requestId": "...", "latencyMs": 123 }
}
```
