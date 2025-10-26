# 4. Non-Functional Requirements (NFRs)

NFR-1 Performance
- Non-AI API p95 < 300 ms (P50 < 100 ms)
- AI endpoints: first byte < 1500 ms; stream when response > 512 tokens

NFR-2 Availability & Reliability
- 99.9% for non-AI endpoints; 99% for AI endpoints (provider dependent)
- Retries (idempotent ops) with jittered backoff; circuit breaker on AI provider failures

NFR-3 Security
- No hardcoded secrets; environment-based config and secret manager support
- Input validation with schema (Zod/DTOs) and authZ checks on resource ownership

NFR-4 Scalability
- Stateless service instances; horizontal scaling; queue-ready for future background jobs

NFR-5 Observability
- Request logging, basic tracing identifiers, and metrics (RPS, error rate, latency)

NFR-6 Compliance & Data
- Clear data retention policy for prompts/responses; PII handling and user export/delete

