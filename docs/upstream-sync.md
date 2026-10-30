# Upstream sync log

Tracks the curated review of `laravel/react-starter-kit` (ADR 0010). Monthly,
the maintainer runs the `/upstream-sync` skill locally: it reviews upstream
commits **after** the marker below and triages each against our ADRs. Adoption
requires explicit approval; every verdict is appended here so nothing is
re-litigated.

## Marker

- **Last reviewed upstream commit:** `98d9b82` (2026-10-29)
- **Last review date:** 2026-10-29

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
| 2026-09-08 | `a2426c3` | Vite server watch-ignore patterns | **adopted** | We had no `server.watch` at all. Adapted: upstream's `.junie` dropped, our `.ai` added — those are the directories that actually exist here. |
| 2026-09-08 | `bac32ec` | `position: sticky` fix in the sidebar layout | deferred | A live defect here, not a hypothetical: `app-sidebar-layout.tsx:11` still carries the exact old `className="overflow-x-hidden"`, which makes a scroll container and silently kills `position: sticky` for anything in the content area. Fix is `min-w-0 overflow-x-clip`. Not adopted this round by decision; re-propose next run. |
| 2026-09-08 | `2b5ab57` | Skeleton sync: `monthly` in a comment, `lsp-*.php` gitignore | deferred | Logging half is comment-only and `monthly` was adopted at `d852be5`. The `lsp-*.php` line is genuinely missing from our `storage/framework/.gitignore`. Not adopted this round by decision. |
| 2026-09-08 | `87cce87` | Drop `indent_size` YAML rules from `.editorconfig` | skipped | Upstream removed theirs because their formatter owns YAML. Ours does not — `vp fmt` has no `.github/**` coverage — so the rules are what holds 2-space YAML for editors. Deleting to match upstream would buy nothing. |
| 2026-09-08 | `bd3ec3e` | Migrate all starter kits to Vite+ | skipped | Already there. ADR 0004 chose vite-plus months ago; upstream has now converged on it. Their diff is deleting `eslint.config.js` and `.prettierrc`, neither of which this repo ever had. |
| 2026-09-08 | `e8fbfd7` | Add `composer.json` to formatter ignores | skipped | Already present, `vite.config.ts` `ignorePatterns`. |
| 2026-09-08 | `0228716` | Strip passkey sections from Inertia auth types | skipped | A `chisel.php` installer change; we do not use chisel, and passkeys stay (ADR 0001). |
| 2026-09-08 | `1e18ad7` | concurrently bump, optional `@laravel/multiplex` | noise | — |
| 2026-10-29 | `bac32ec` | `position: sticky` fix in the sidebar layout (deferred 2026-09-08) | **adopted** | `app-sidebar-layout.tsx` now `min-w-0 overflow-x-clip`. No page here uses sticky yet; it protects the first descendant that does. |
| 2026-10-29 | `2b5ab57` | `lsp-*.php` in `storage/framework/.gitignore` (deferred 2026-09-08) | **adopted** | The logging half stays skipped (comment-only). |
| 2026-10-29 | `e82c316` | vite-plus → 1.x for security advisories | **adapted** | `vite-plus` ^1.4.0, the `vite` alias pinned to `vite-plus-core@1.4.0` (was `@latest`, which had drifted to 0.3.1 against vite-plus 0.2.9), and an `overrides` entry so Vitest's nested `vite@8.2.1` resolves to the core too. Clears the vite/vite-plus advisories; others in `bun audit` remain (shell-quote, undici, brace-expansion, …). New oxfmt rewrapped one `font-family` in the Filament theme; 1.x's lint adds six React Compiler warnings (no errors). Chisel/CI parts skipped. |
| 2026-10-29 | `dbd4817` | File-cache `lock_path` → `framework/cache/locks` | **adopted** | Moot under our default `CACHE_STORE=database`; matters to any descendant on the file driver, where `cache:clear` deleted held locks. The `.codex` gitignore and YAML `.editorconfig` parts skipped — ours commits agent config, and already had the YAML rules. |
| 2026-10-29 | `717b8f5` | User implements `MustVerifyEmail` | skipped | Already does (`User.php`). |
| 2026-10-29 | `8e44013` | oxfmt `stylesheet` option for Tailwind sorting | skipped | Already uses it (`vite.config.ts`). |
| 2026-10-29 | `98d9b82` | `Unique` in `ProfileValidationRules` return types | skipped | Our docblocks type the arrays as `mixed`; the PHPStan gap they closed doesn't exist here. |
| 2026-10-29 | `0c94c26` | Gitignore Boost and AI assistant files | skipped | This repo commits `.claude/settings.json` and `.ai/` on purpose. |
| 2026-10-29 | 3 commits | Chisel ×2 (`6626e52`, `29086ec`), comment typo in vendor `ui/sidebar.tsx` (`504dfac`) | noise | — |
