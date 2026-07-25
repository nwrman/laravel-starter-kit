# Upstream sync log

Tracks the curated review of `laravel/react-starter-kit` (ADR 0010). The
monthly routine reviews upstream commits **after** the marker below, triages
each against our ADRs, and opens a GitHub issue with candidates. Adoption
requires explicit approval; every verdict is appended here so nothing is
re-litigated.

## Marker

- **Last reviewed upstream commit:** _none — first run pending, catch-up window
  starts 2026-06-01_
- **Last review date:** —

## Standing auto-skips (from ADRs — do not re-propose)

| Upstream change type | Verdict | Why |
|---|---|---|
| Appearance/theme/dark-mode system | skip | ADR 0003 |
| npm / eslint / vanilla-vite tooling | skip | ADR 0004 (bun + oxlint + vite-plus) |
| PHPUnit / flat test layout | skip | ADR 0004 (Pest, mirrored tree) |
| Marketing `welcome.tsx` | skip | ADR 0004 (`/` → dashboard redirect) |
| Their passkey *implementation* | adapt-only | ours differs (ADR 0001); port ideas, not files |

## Triage log

_(append one row per reviewed upstream commit)_

| Date | Upstream commit | Change | Verdict | Notes |
|---|---|---|---|---|

## Known pending candidates (pre-logged before first run)

- Jul 14 2026 — "Fix resuming two-factor setup after closing the modal" —
  likely applies to `resources/js/components/two-factor-setup-modal.tsx`
- Jun 11 2026 — "Advertise passkey endpoints via the well-known URL"
- Jul 20 2026 — "Use the app name from config in the brand component"
