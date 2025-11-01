# 8. Security and Reliability

- **Secrets:** No hardcoded keys; env vars + secret manager; server-only runtime for AI keys
- **Validation:** DTOs for all inputs; return 400 with details on invalid payloads
- **Rate Limiting:** Per user/IP, strict on AI and write endpoints (configurable thresholds)
- **Retries / Circuit Breaker:** Jittered backoff for idempotent ops; breaker on AI provider failures
- **Logging:** Structured with redaction; propagate correlation IDs from Next → service
