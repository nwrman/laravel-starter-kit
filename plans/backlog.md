# Backlog — undecided ideas

Options nobody has committed to yet. These are **not** decisions; when one is
chosen and built, record the decision as an ADR under `docs/adr/` and remove it
from here.

## Passkeys

- **Conditional-UI passkey autofill** — add `autocomplete="username webauthn"` and
  a `mediation: 'conditional'` get on the login email field, so passkeys surface
  in browser autofill. Modern UX. Effort: small.
- **Toolkit-ify passkeys** — move the passkey feature into
  `nwrman/laravel-toolkit` so future projects get it on install. Higher effort,
  high reuse.
- **Backport passkeys to `minuta-app`** — same Fortify/Inertia/base-ui stack;
  currently lacks passkeys.

## Auth

- **Magic-link (passwordless) login** — minuta built `MagicLinkMail` + view.
  Not adopted into the starter during the 2026-07-24 grilling; adopt only if a
  second app wants it.

## Origin

The passkey items came from a read-only `/improve` audit of PR #6 (passkeys /
WebAuthn). The audit's five execution plans were implemented and merged in commit
`f49e074`; only these forward-looking ideas were left open.
