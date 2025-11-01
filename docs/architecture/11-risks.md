# 11. Risks and Mitigations

- **Provider instability/cost:** Mitigated by retries, circuit breaker, budget monitoring
- **Regression during migration:** Mitigated via strangler pattern, feature flags, smoke tests
- **Secret leakage:** Mitigated by env-only keys, rotation procedures, audits
