# Story 4.3 - Calendar UX and Unified Modal

Status: Draft  
Epic: docs/epics/epic-4-calendar-autoposting.md

## Story
As a creator,
I want a clear calendar and a single modal to review/edit posts,
so I can trust scheduling and make quick adjustments.

## Acceptance Criteria
1. Calendar grid (week/month) with Buffer-like layout: drag/drop to reschedule, bulk shift by offset, tile badges for readiness (ready, missing media, token expired, failed retry, published, needs attention).  
2. Unified modal (IG-style) for a post: media preview, edit cover, AI-prefilled caption/hashtags/time, per-channel toggles/fields (IG: tags, location, AI label; TikTok: caption/hashtags, sound if available).  
3. Time editing: AI proposes default; user can adjust; drag/drop updates time; bulk shift updates entries consistently.  
4. Readiness warnings in modal (missing media/token/failed retry) with resolve actions (upload media, relink, retry).  
5. Actions: Save draft, Schedule (default), Publish now (if allowed by API/flag); updates reflect in calendar and backend entries.  
6. Accessibility/responsiveness: keyboard navigation, focus-visible, mobile-friendly condensed view (list/week) with same badges/actions.

## Integration Verification
IV1. Drag/drop and bulk shift persist and reflect in backend entries.  
IV2. Modal shows AI-prefilled content; edits persist and update calendar tile.  
IV3. Readiness warnings appear when media/token missing; resolved state clears after fix.  
IV4. Publish-now (if enabled) updates status and tile.

## Dependencies
- Story 4.1 readiness data; Story 4.2 publish status.  
- UX spec `docs/ux/calendar-autoposting-ux-spec.md`; PRD FR-4/FR-5b.

## Tasks / Subtasks
- [ ] Calendar UI: drag/drop, bulk shift, badges, filters (channel/readiness).  
- [ ] Modal UI: IG-style layout, AI-prefills wired, per-channel fields, actions (save draft/schedule/publish-now).  
- [ ] Wire to APIs: update times, statuses, readiness; ensure feature flags respected.  
- [ ] A11y/responsive adjustments; tests/Playwright scripts for key flows.

### Testing
- UI/RTL: modal renders AI-prefills and channel fields; readiness warnings show.  
- E2E/Playwright: drag/drop reschedule persists; bulk shift works; publish-now path; readiness changes after resolving media/token.  
- Manual accessibility: keyboard drag/drop alternative, focus states, mobile layout sanity.

## Change Log
| Date       | Version | Description      | Author |
|------------|---------|------------------|--------|
| 2025-12-15 | v0.1    | Initial draft    | PO     |
