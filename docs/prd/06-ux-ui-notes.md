# 6. Early UX/UI Notes

- Spanish-first content; calm “notebook” theme; Playfair/Inter typography; consistent accent color (`#8A0F1C`), replace inconsistent `#960018`
- Pages: `/` landing, `/auth`, `/dashboard`, `/ideas`, `/planes/[id]`, `/calendario`, `/biblioteca`
- Interaction patterns: short plan-chat prompts; focus-visible rings; accessible labels; responsive on common breakpoints
- Empty states and loading: skeletons for ideas/plans; gentle transitions; clear error toasts
- Streaming AI (calendar): show in-progress state (spinner/progress banner), append entries as they stream, allow cancel, surface final toast on completion
- Calendar UI: Buffer-like grid with drag/drop and bulk shift; tile states (ready, missing media, token expired, failed retry, published)
- Modal: IG-style post sheet with AI-prefilled caption/hashtags/cover/time; channel-specific tweaks in one modal; surface readiness warnings and retry/needs-attention banners
