# 7. Data Models and Schema

- **Ideas:** id, user_id, title, content, created_at, tags
- **Plans:** id, user_id, idea_id?, title, status, created_at, updated_at, summary
- **PlanSections:** id, plan_id, order, title, body
- **Pieces:** id, user_id, plan_id?, type, url, metadata, created_at
- **CalendarRuns:** id, calendar_id, user_id, plan_id?, status (`completed|timeout|failed`), started_at, completed_at, tokens, model, latency_ms, piece_count, diff JSONB, cadence, channels[], start_date, end_date
- **CalendarEntries:** id, run_id, calendar_id, user_id, plan_id?, entry_key, payload JSONB (normalized `CalendarPiece`), created_at

### Schema Integration
- Prefer additive migrations; maintain backward compatibility throughout cut-over
- Important indexes: `(user_id, created_at)` for lists; `(plan_id, order)` for sections; `(calendar_id)` and `(entry_key)` for calendar diffs
