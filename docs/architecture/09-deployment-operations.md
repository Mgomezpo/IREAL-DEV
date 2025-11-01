# 9. Deployment and Operations

- **Frontend:** Vercel
- **Service:** Container image deployed to managed platform (Render/Fly/Railway)
- **CI/CD:** Build, lint, typecheck; publish OpenAPI artifact; tag container image
- **Configuration:** `.env` per environment + secret store; minimal feature flags for migration control
