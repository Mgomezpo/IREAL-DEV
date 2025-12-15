# 11. Risks and Mitigations

- **Provider instability/cost:** Mitigated by retries, circuit breaker, budget monitoring
- **Regression during migration:** Mitigated via strangler pattern, feature flags, smoke tests
- **Secret leakage:** Mitigated by env-only keys, rotation procedures, audits
- **Platform API limits/ban risk (IG/TikTok):** Mitigated via official SDK/API use, rate limiting, backoff, and clear error surfacing
- **Publish reliability:** Mitigated via preflight checks (media/tokens), capped retries, and needs-attention state to prevent silent failures
