# 18. Inertia history encryption is on by default

Date: 2026-11-10

## Status

Accepted

## Context

Inertia keeps every visited page's props in the browser's history state, so the back button
can show a page without asking the server. In this kit those props are team data: projects,
members, the current user. Logout already calls `Inertia::clearHistory()`
(`app/Http/Responses/LogoutResponse.php`), and so does account deletion
(`app/Http/Controllers/DeleteUserController.php`). With encryption off, though, that call
has nothing to throw away: the history entries hold the props in plain text. Someone at the
same browser after logout, or anything that can read its history state, still sees them.

Inertia ships history encryption for this, off by default (`config/inertia.php`,
`INERTIA_ENCRYPT_HISTORY`). With it on, each page is encrypted (AES-GCM, through
`window.crypto.subtle`) before it is written to history, under a key kept in
`sessionStorage`. `clearHistory` removes that key. A back-button visit after logout cannot
decrypt the entry, so Inertia fetches the page from the server instead, and the auth
middleware sends it to the login screen. Inertia re-checks entries that the browser's
back/forward cache restores, too (`pageshow`), so that route doesn't skip the check.

## Decision

**`INERTIA_ENCRYPT_HISTORY` defaults to `true`**, in `config/inertia.php` and in
`.env.example`. Every descendant Product inherits it.

## Consequences

- Logout and account deletion actually remove authenticated page data from the browser,
  not just the entries that point to it.
- Encryption needs a secure context: HTTPS, `localhost` or `127.0.0.1`. Herd serves `.test`
  over HTTPS, and Pest's browser server runs on `127.0.0.1`. On a plain-HTTP host, Inertia
  logs "Encryption is not supported in this environment. SSL is required." to the console
  and stores the page unencrypted. The app still works there, but without the protection.
- Each history write and each back-button visit pays for one encrypt or decrypt. That costs
  little next to a page's network round trip.
- A Product that holds no data worth protecting can turn it off with
  `INERTIA_ENCRYPT_HISTORY=false`. That's a per-environment choice, not a code change.
