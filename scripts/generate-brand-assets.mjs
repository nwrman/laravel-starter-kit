import { readFileSync } from 'node:fs';
// oxlint-disable no-console -- CLI script; console output is its interface.
/**
 * Regenerates every derived brand asset from a single source: public/logo.svg
 * (plus APP_NAME / the theme colors below).
 *
 *   bun run brand
 *
 * Outputs:
 *   public/og-image.png                  social share card (1200x630)
 *   public/email-logo.png                email header mark (96x96, @2x of 48px)
 *   public/web-app-manifest-192x192.png  PWA icon (maskable)
 *   public/web-app-manifest-512x512.png  PWA icon (maskable)
 *
 * Rebranding a new project: replace public/logo.svg, update the palette below to
 * match resources/css/app.css, sync the path in app-logo-icon.tsx, re-run. See
 * docs/branding.md.
 */
import { chromium } from 'playwright';

// Keep in sync with resources/css/app.css (--primary) and the mail theme.
const PRIMARY = '#00397f';
const BAND = '#f4f6fa';

const appName = (readFileSync('.env', 'utf8').match(/^APP_NAME=(.*)$/m)?.[1] ?? 'Laravel')
  .trim()
  .replace(/^["']|["']$/g, '');

const logo = readFileSync('public/logo.svg', 'utf8');
const sized = (svg, css) => svg.replace('<svg', `<svg style="${css}"`);
// The mark ships in brand red; recolor to white when it sits on the primary tile.
const white = (svg) => svg.replaceAll('#FF2D20', '#ffffff');

const page = (body, bg) =>
  `<!doctype html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:${bg}">${body}</body>`;

/** Navy rounded tile with the white mark — the same lockup as the app sidebar. */
const tile = (size) =>
  `<div style="width:${size}px;height:${size}px;background:${PRIMARY};border-radius:${Math.round(size * 0.22)}px;display:flex;align-items:center;justify-content:center">
     <div style="width:${Math.round(size * 0.62)}px">${sized(white(logo), 'width:100%;height:auto;display:block')}</div>
   </div>`;

const browser = await chromium.launch();
const shoot = async (path, width, height, html, scale = 1) => {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await p.setContent(html);
  await p.screenshot({ path });
  await p.close();
};

// Social share card: tile + app name, primary accent bar.
await shoot(
  'public/og-image.png',
  1200,
  630,
  page(
    `<div style="width:1200px;height:630px;background:#ffffff;display:flex;align-items:center;justify-content:center;gap:36px;position:relative">
       ${tile(150)}
       <span style="font-size:86px;font-weight:700;color:${PRIMARY};letter-spacing:-0.02em">${appName}</span>
       <div style="position:absolute;bottom:0;left:0;right:0;height:12px;background:${PRIMARY}"></div>
     </div>`,
    '#ffffff',
  ),
);

// Email header mark: rendered at 2x, displayed 48px in the mail template.
await shoot('public/email-logo.png', 96, 96, page(tile(96), BAND));

// Maskable PWA icons: full-bleed white, mark inside the 80% safe zone.
for (const size of [192, 512]) {
  await shoot(
    `public/web-app-manifest-${size}x${size}.png`,
    size,
    size,
    page(
      `<div style="width:${size}px;height:${size}px;background:#ffffff;display:flex;align-items:center;justify-content:center">
         <div style="width:${Math.round(size * 0.55)}px">${sized(logo, 'width:100%;height:auto;display:block')}</div>
       </div>`,
      '#ffffff',
    ),
  );
}

await browser.close();
console.log(`brand assets regenerated for "${appName}"`);
