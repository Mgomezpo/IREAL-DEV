# Story 4.1 - Channel Accounts & Readiness States

Status: Draft  
Epic: docs/epics/epic-4-calendar-autoposting.md

## Story
As a creator,
I can link my IG/TikTok account and see whether my scheduled posts are ready,
so that I trust the calendar before autoposting.

## Acceptance Criteria
1. Accounts: `POST /v1/accounts/ig|tiktok/link`, `GET /v1/accounts`, `DELETE /v1/accounts/{id}` with encrypted token storage, per-account timezone, status (`ok|expired|revoked`), and readiness exposed to UI.  
2. Calendar entries carry readiness field (`ready|missing_media|token_expired|failed_retry|published|needs_attention`) and channel; endpoints return readiness.  
3. Readiness transitions: missing media or expired token → needs_attention; when resolved, entry returns to scheduled/ready.  
4. Next.js proxies updated to consume account readiness and calendar readiness for tile badges (ready, missing media, token expired, failed retry, published, needs attention).  
5. OpenAPI/docs updated for account endpoints and readiness fields (architecture 06/07).

## Integration Verification
IV1. Linking IG/TikTok returns account with timezone/status; deleting removes it.  
IV2. Calendar list shows readiness per entry; UI tiles display correct badges.  
IV3. Changing media/token state updates readiness on next fetch without redeploy.

## Dependencies
- PRD FR-4/FR-5b; UX spec (`docs/ux/calendar-autoposting-ux-spec.md`).
- Architecture updates in 06-api-design.md, 07-data-models.md (readiness, accounts).

## Tasks / Subtasks
- [ ] Add `ChannelAccounts` model, migrations, and encryption for tokens; implement link/list/delete.  
- [ ] Extend calendar entries with readiness + channel; return in APIs; add tests.  
- [ ] Update Next.js proxies and UI tile badges to render readiness states.  
- [ ] Update OpenAPI and architecture references.

### Testing
- Unit/integration: account link/list/delete, readiness field on calendar entries.  
- UI/Playwright/manual: link account → calendar shows ready; expire token → shows token expired; missing media → shows missing media.

## Change Log
| Date       | Version | Description                     | Author |
|------------|---------|---------------------------------|--------|
| 2025-12-15 | v0.1    | Initial draft                   | PO     |
