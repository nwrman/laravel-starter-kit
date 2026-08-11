# Branding a project built on this starter

One source of truth — **`public/logo.svg`** — plus the app name and palette.
Everything else is generated or reads config, so the app UI, social card, PWA
icons and emails can't drift apart.

## What derives from what

| Surface | Source | How |
|---|---|---|
| Sidebar / app shell logo | `resources/js/components/app-logo-icon.tsx` | inline SVG path (mirrors `logo.svg`) |
| App name everywhere in the UI | `config('app.name')` | shared Inertia prop `name` |
| Social share card `og-image.png` | `logo.svg` + `APP_NAME` + palette | `bun run brand` |
| Email header mark `email-logo.png` | `logo.svg` + palette | `bun run brand` |
| Email header name | `config('app.name')` | rendered at send time |
| PWA icons `web-app-manifest-*.png` | `logo.svg` | `bun run brand` |
| Favicon | `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | replaced by hand |

## Rebranding checklist

1. **Name** — set `APP_NAME` in `.env` (and `.env.example`). The UI, email
   header, OG card and `<title>` all follow. Also update `name`/`short_name` in
   `public/site.webmanifest` (a static file).
2. **Description** — set `APP_DESCRIPTION`; feeds the meta description and the
   Open Graph / Twitter share tags.
3. **Mark** — replace `public/logo.svg` with the new mark (square-ish artwork,
   single color). Then paste its `d` path into
   `resources/js/components/app-logo-icon.tsx` so the in-app logo matches — that
   file deliberately carries no `fill`, so `fill-current` tints it.
4. **Palette** — update `--primary` in `resources/css/app.css`, then mirror the
   resolved hex in two places that can't read CSS variables:
   - `scripts/generate-brand-assets.mjs` (`PRIMARY`, `BAND`)
   - `resources/views/vendor/mail/html/themes/default.css` (color table at the top)

   To resolve an `oklch()` value to hex, render it in a browser and read the
   pixel back — the CSS variable is authoritative, the hex copies follow it.
5. **Regenerate** — `bun run brand`. Rewrites `og-image.png`, `email-logo.png`
   and both `web-app-manifest-*.png`.
6. **Favicons** — replace `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`
   by hand (browsers want specific formats/sizes; not worth generating).
7. **Verify** — `composer preflight`, then send yourself a password-reset mail
   (Mailpit at `:8025`) and check the header renders.

## Notes

- Email images must be **raster**: most mail clients won't render SVG, which is
  why `email-logo.png` exists rather than pointing at `logo.svg`.
- `og:image` must be an **absolute** URL — `resources/views/app.blade.php` uses
  `asset()` for that reason; crawlers don't reliably resolve relative paths.
- The email header keeps the app name as *text*, not baked into the image, so
  renaming the app needs no new asset.
