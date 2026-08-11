# Upstream sync log

Tracks the curated review of `laravel/react-starter-kit` (ADR 0010). Monthly,
the maintainer runs the `/upstream-sync` skill locally: it reviews upstream
commits **after** the marker below and triages each against our ADRs. Adoption
requires explicit approval; every verdict is appended here so nothing is
re-litigated.

## Marker

- **Last reviewed upstream commit:** `d852be5` (2026-07-30)
- **Last review date:** 2026-08-11

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
| 2026-07-24 | `596f44d` | Unicode/whitespace-safe initials | **adopted** | `use-initials.tsx` had the old buggy code |
| 2026-07-24 | `0e1e97d` | App name from shared props in brand component | **adopted** | `app-logo.tsx` hardcoded "Laravel"; test-mock default `name` added |
| 2026-07-24 | `c14d860` | `.well-known/passkey-endpoints` route | **adapted** | pointed at our `security.edit`; test in PasskeyTest |
| 2026-07-24 | `3345b9e` | 2FA modal resume fix | skipped | already equivalent (`two-factor-setup-modal.tsx:260`) |
| 2026-07-24 | `06f3e6f` | Passkey name from user agent | skipped | we already display provider/device names |
| 2026-07-24 | `a01c2cb` | `expectsJson` in shouldRenderJsonWhen | skipped | conflicts with our custom 401/419 session-expired design; revisit if JSON APIs added |
| 2026-07-24 | `8a1aff3` | `artisan dev` in composer dev | skipped | ADR 0004 — own dev toolchain |
| 2026-07-24 | `a12bae1` | Add Larastan | skipped | already have it |
| 2026-07-24 | `5711814` `23c871f` `ab24332` `673d8dd` `578ad03` `c37ddd5` `32907da` | CI/installer/maestro infra | skipped | not applicable to this fork's own CI/installer |
| 2026-07-24 | 7 commits | dependabot bumps ×3, skeleton syncs ×3, node-deps cleanup | noise | — |
| 2026-08-11 | `d852be5` | logging: `daily.days` → `max_files`, add `monthly` channel | **adopted** | Required Laravel ≥13.7 (`createMonthlyDriver`, `max_files`); adopted after upgrading 13.6→13.25 in the same session. On 13.6 it would have silently cut retention to the 7-day default. |
