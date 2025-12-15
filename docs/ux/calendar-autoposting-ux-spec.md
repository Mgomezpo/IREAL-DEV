# Calendar & Autoposting UX Spec

## Purpose & Scope
- Define the calendar and publishing modal UX for Instagram and TikTok (single linked account in MVP).
- Aligns with PRD FR-4 and FR-5b updates; leverages Buffer-like calendar layout and IG-style modal.

## Users
- Content creators managing one IG/TikTok account (per-account timezone).
- Goal: schedule, adjust, and autopost short-form content quickly with clear readiness signals.

## Primary Flows
1) AI proposes schedule from plan -> user reviews calendar -> edits times via drag/drop or bulk shift.
2) User opens a post tile -> unified modal shows AI-filled content -> user tweaks -> saves (scheduled) or publishes now.
3) System preflight (media + token) -> publish -> retries on failure -> surface needs-attention on calendar.

## Layout (Calendar)
- Grid view (Buffer-like) with week/month toggle; list view optional later.
- Left rail: account avatar (single in MVP), filters (channel, tags/readiness).
- Top bar: date navigation (today/prev/next), Week/Month toggle, filters (channel/tags/readiness), “New post” / “New idea.”
- Tiles: show thumbnail, channel icon, title/time, readiness badge (Ready, Missing media, Token expired, Failed retry, Published).
- Interactions: drag/drop to reschedule; bulk shift (select range -> move by offset); click to open modal.

## Tile States & Indicators
- Ready (green), Missing media (warning), Token expired (error), Failed retry (error), Scheduled (neutral), Published (success), Needs attention (error/amber).
- Hover/tooltip shows status detail and next action (e.g., “Upload media” / “Relink account” / “Retry failed post”).

## Modal (IG-style, unified per post)
- Structure: media preview + edit cover; caption field; AI-filled hashtags; time picker (AI default, editable); channel toggles (IG/TikTok) within one modal.
- Channel-specific fields:
  - IG: cover, tags/mentions, location, AI label toggle, audience, “also share on…” (future).
  - TikTok: cover/thumbnail, caption/hashtags, sound selection (if available via API).
- Readiness warnings inline: missing media, token expired, failed retry; show “Retry now” or “Resolve and reschedule.”
- Actions: Save draft, Schedule (default), Publish now (if allowed by API), Delete.

## Scheduling & Time
- Per-account timezone; AI suggests slot; user can edit to any time.
- Back-planning prompts (implicit): media readiness by T-24h, review by T-6h; if missing, show Needs attention and allow reschedule.
- Drag/drop updates time and keeps retries/notifications in sync.

## Errors, Retries, Notifications
- Publish retries: 3 attempts at 5m/15m/30m; after that, mark Failed retry (needs attention) and show reason.
- Missing media: skip/reschedule prompt; tile shows warning until media uploaded.
- Token expired: tile shows error; modal shows relink CTA.
- In-app alerts for failure/needs attention; optional email summary later.

## Accessibility & Responsiveness
- Keyboard support: navigate tiles, open modal, drag/drop alternative via move controls; focus-visible states.
- Responsive: month/week grid on desktop; condensed week/list on mobile with same readiness badges and quick edit.

## Open Questions
- Sounds/music support for TikTok (API dependent).
- “Publish now” availability per channel (depends on platform API constraints).
