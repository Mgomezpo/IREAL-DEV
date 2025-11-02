# 6. API Design and Integration

- **Strategy:** Versioned `/v1` REST with standardized envelope and error handling; DTO/class-validator everywhere
- **Authentication:** Forward Supabase user/session context; enforce ownership at service boundaries
- **Versioning:** Start with `/v1`; maintain backward-compatible changes during migration

### Representative Endpoints
- Ideas: `GET/POST /v1/ideas`, `GET/DELETE /v1/ideas/{id}`, `POST /v1/ideas/{id}/plans:attach`
- Plans: `GET/POST /v1/plans`, `GET/PATCH/DELETE /v1/plans/{id}`, sections CRUD (`POST /v1/plans/{id}/sections`, `PATCH/DELETE /v1/plans/{id}/sections/{sectionId}`), `POST /v1/plans/{id}/sections:reorder`, and `POST /v1/plans/{id}/ideas:attach`
- AI: `POST /v1/ai/generate`, `POST /v1/ai/plan-chat`, `POST /v1/ai/calendar`
- Health/Metrics: `GET /healthz`, `GET /metrics`

### Response Envelope
```json
{
  "data": { /* payload */ },
  "error": null,
  "meta": { "requestId": "...", "latencyMs": 123 }
}
```
