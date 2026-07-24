# 4. Deliberate divergences from upstream

Date: 2026-07-24

## Status

Accepted

## Context

Beyond auth (see [ADR 0001](0001-fortify-owns-all-auth-routes.md)) and dark mode
(see [ADR 0003](0003-no-dark-mode.md)), this fork carries several features and
toolchain choices the official Laravel React starter kit does not. Left
unrecorded, a future contributor "realigning with upstream" could strip these as
though they were drift. They are not — each was a deliberate keep-or-choose.

## Decision

The following divergences are intentional and are to be preserved:

**Features upstream lacks (we keep them):**

- **Spatie MediaLibrary profile photos** — upload, crop, and delete. Upstream has
  no profile photo feature.
- **Demo pages** — dashboard (KPIs/charts), projects, and team pages. Upstream
  ships none of these.

**Toolchain choices (we chose differently):**

- **bun + oxlint + vite-plus** instead of upstream's npm + eslint + vanilla vite.
- **Pest 5 + Pest Browser (Playwright)** with a `tests/` tree mirroring `app/`,
  instead of upstream's PHPUnit with a flat `Feature/Auth`, `Feature/Settings`
  layout.
- **React Compiler** is wired via `@rolldown/plugin-babel` in `vite.config.ts`.
  Upstream leaves it out; we investigated and adopted it.

**Test-scope choice:**

- We do **not** re-test Fortify's own package behavior — it has an upstream suite.
  Our tests cover our contract actions, our view bindings, and our integrations.
  (Detailed in [ADR 0001](0001-fortify-owns-all-auth-routes.md).)

## Consequences

- These are not candidates for removal during an upstream sync. Merging from
  upstream must preserve them.
- The Spatie photo flow (upload + crop + delete) and the demo pages rendering are
  standing invariants; they are asserted by the Browser suite.
- ULIDs and the session-expired modal are further divergences, recorded as
  invariants in [ADR 0001](0001-fortify-owns-all-auth-routes.md) because they ride
  on the auth layer.
