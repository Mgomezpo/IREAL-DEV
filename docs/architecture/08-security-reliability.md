# 8. Security and Reliability

- **Secrets:** No hardcoded keys; env vars + secret manager; server-only runtime for AI keys; channel tokens stored encrypted.
- **Validation:** DTOs for all inputs; return 400 with details on invalid payloads; enforce ownership at service boundary.
- **Rate Limiting:** Per user/IP; stricter on AI and write endpoints; configurable thresholds.
- **Retries / Circuit Breaker:** Jittered backoff for idempotent ops; breaker on AI provider failures; publish jobs retry 3x (5m/15m/30m) then mark `needs_attention`.
- **Logging:** Structured with redaction; propagate correlation IDs from Next to service; log publish attempts with request/job IDs.
- **Preflight (Autoposting):** Before publish, ensure media present and token valid; otherwise mark `needs_attention` and notify UI.
- **Webhooks:** If used, verify signatures/shared secrets; drop and log invalid callbacks.
