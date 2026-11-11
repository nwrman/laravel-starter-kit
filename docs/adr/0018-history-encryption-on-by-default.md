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

Encryption covers only what Inertia writes to history. The first page of a full page load
lives in the document itself: in its rendered DOM and in its `data-page` props. Ticket #43's
browser walk loaded `/team` in full, loaded another page, logged out, and pressed Back.
Chrome restored the `/team` document from its back/forward cache, team data included,
because Laravel's default `Cache-Control: no-cache, private` lets it keep the page.

## Decision

**`INERTIA_ENCRYPT_HISTORY` defaults to `true`**, in `config/inertia.php` and in
`.env.example`. Every descendant Product inherits it.

**Every response to a signed-in user sends `Cache-Control: no-store, private`**
(`App\Http\Middleware\PreventCachingAuthenticatedResponses`, appended to the `web` group),
so the browser keeps no authenticated document to restore. Chrome's newer back/forward
cache can hold some `no-store` pages, but it evicts them when cookies change, and logout
changes them. Encryption protects history entries; the header protects the document.

## Consequences

- Logout and account deletion actually remove authenticated page data from the browser,
  not just the entries that point to it.
- Back across a full page load re-fetches instead of restoring from memory. Most
  navigation is inside one document, where this doesn't apply.
- Encryption needs a secure context: HTTPS, `localhost` or `127.0.0.1`. Herd serves `.test`
  over HTTPS, and Pest's browser server runs on `127.0.0.1`. On a plain-HTTP host, Inertia
  logs "Encryption is not supported in this environment. SSL is required." to the console
  and stores the page unencrypted. The app still works there, but without the protection.
- Each history write and each back-button visit pays for one encrypt or decrypt. That costs
  little next to a page's network round trip.
- A Product that holds no data worth protecting can turn it off with
  `INERTIA_ENCRYPT_HISTORY=false`. That's a per-environment choice, not a code change.
