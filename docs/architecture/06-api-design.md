# 6. API Design and Integration

- **Strategy:** Versioned `/v1` REST with standardized envelope and error handling; DTO/class-validator everywhere
- **Authentication:** Forward Supabase user/session context; enforce ownership at service boundaries
- **Versioning:** Start with `/v1`; maintain backward-compatible changes during migration

### Representative Endpoints
- Ideas: `GET/POST /v1/ideas`, `GET/DELETE /v1/ideas/{id}`
- Plans: `GET/POST /v1/plans`, `PATCH /v1/plans/{id}`, `POST /v1/plans/{id}/sections:reorder`
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
