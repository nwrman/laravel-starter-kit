# 1. Fortify owns all authentication routes

Date: 2026-07-24

## Status

Accepted

## Context

This repository began as a fork of the official Laravel React starter kit. The
fork had grown its own hand-written authentication layer: a custom
`SessionController`, `UserController` (registration),
`UserPasswordController` (forgot/reset), `UserEmailResetNotificationController`,
`UserEmailVerificationController`, and `UserEmailVerificationNotificationController`,
each with its own Form Request, Action, and Feature/Browser tests. Password
change and two-factor authentication lived on two separate settings pages.

Maintaining a parallel auth stack meant re-testing behavior that Laravel Fortify
already tests upstream, and it made pulling improvements from the official kit
progressively harder as the two diverged.

## Decision

Fortify owns every authentication route. The fork's custom auth controllers,
their Actions, and their tests were deleted. Only the two Fortify contract
actions that carry *our* business logic remain in `app/Actions/Fortify/`:
`CreateNewUser` and `ResetUserPassword`.

Inertia pages moved to Fortify's naming under `resources/js/pages/auth/`
(`login`, `register`, `forgot-password`, `reset-password`, `verify-email`,
`confirm-password`, `two-factor-challenge`). Password + 2FA consolidated into a
single `resources/js/pages/settings/security.tsx`.

We do **not** re-test Fortify's own package behavior. Our tests cover only:
(a) our contract actions, (b) that view bindings render the right Inertia pages
with the right props, and (c) that our integrations below still hold.

Note: the profile page was intentionally left at
`resources/js/pages/user-profile/edit.tsx` rather than moved to
`settings/profile.tsx`. Only password + 2FA were consolidated.

## Consequences

These invariants must hold; they are the fork's integrations that ride on top of
Fortify-owned auth and are not covered by Fortify's upstream suite:

- **Session-expired modal** triggers on 401 XHR and 419 CSRF failures.
- **`RecordLastLogin` listener** (`app/Listeners/RecordLastLogin.php`) fires on
  login and updates `users.last_login_at`.
- **Login rate limiter** — 5/min, keyed by lowercased email + IP
  (`FortifyServiceProvider::bootRateLimitingDefaults`).
- **Two-factor rate limiter** — 5/min, keyed by the `login.id` session value.
- **Passkeys rate limiter** — 10/min, keyed by credential id (or session id) + IP.
- **ULID primary keys** retained on `users` (`User` uses `HasUlids`) and on
  `sessions.user_id`. ULIDs predate this migration and were preserved through it.

Reversing this is expensive: it would mean rebuilding the deleted controllers,
Actions, requests, and tests. That cost is the point — it keeps us aligned with
upstream instead of drifting.
