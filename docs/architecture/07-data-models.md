# 7. Data Models and Schema

- **Ideas:** id, user_id, title, content, created_at, tags
- **Plans:** id, user_id, idea_id?, title, status, created_at, updated_at, summary
- **PlanSections:** id, plan_id, order, title, body
- **Pieces:** id, user_id, plan_id?, type, url, metadata, created_at

### Schema Integration
- Prefer additive migrations; maintain backward compatibility throughout cut-over
- Important indexes: `(user_id, created_at)` for lists; `(plan_id, order)` for sections
