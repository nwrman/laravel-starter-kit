# 16. Postgres is the only database

Date: 2026-10-30

## Status

Accepted (supersedes 0013)

## Context

[ADR 0013](0013-sqlite-default-postgres-shipped.md) kept sqlite as the default test driver
and planned to ship the Postgres path as a documented switch. It rejected Postgres as the
default because it "costs every fresh clone a running database server before anything works,
and it buys correctness only for apps that would have switched anyway".

Building that switch (#12) put the second half of the argument against the record:

- Every app on this starter that reached production tests on Postgres — anidigraf-socios,
  minuta, talok. The ones still on sqlite are personal or small.
- The starter's own production target is already Postgres: the `provision-laravel-cloud`
  skill provisions `neon_serverless_postgres_18`. The suite proved the app on one engine and
  shipped it on another.

So "apps that would have switched anyway" is nearly every app, and each one paid for the
switch separately. The first half of the argument does not hold for this starter's audience
either: it is for its owner's apps, built on machines that run Postgres (DBngin) already.

Keeping sqlite as a fallback was considered and rejected. Building it is an hour; keeping it
is the problem. CI would prove Postgres only, so the fallback breaks unnoticed the first time
the starter uses something only Postgres has — `ilike`, `jsonb` operators, `unaccent`,
functional indexes — which is the reason to be on Postgres at all. Keeping it alive means
writing every migration portably or running a second CI lane, which 0013 already rejected.

## Decision

**Postgres is the only database**, for development, tests, worktrees and CI.

- `phpunit.xml` forces `DB_CONNECTION=pgsql` and deliberately does not force `DB_DATABASE`:
  the name comes from `.env.testing`, so each worktree owns its test database.
- `Tests\TestCase` refuses to run unless the test database's name ends in `_test`. It checks
  before the traits boot, so the run dies ahead of the first migration — `RefreshDatabase`
  would otherwise wipe whatever `.env` points at, which is the development database.
- `.env.testing.example` is committed with a throwaway `APP_KEY` and passkey secret. They are
  disposable by construction: the file only ever names a `_test` database.
- `composer create-project` names the databases after the project folder and creates both
  through `migrate`, which creates a missing Postgres database itself.
- A worktree gets its database from Herd and its `_test` database from `herd.yml`, which
  fails the setup rather than let a worktree share the main checkout's database.
- CI's test lane runs a Postgres 18 service; the lanes that need no database keep an
  in-memory stub so artisan can boot.

## Consequences

- **A fresh clone needs Postgres running** before `composer test` passes. With DBngin on the
  defaults (`127.0.0.1:5432`, user `postgres`), `create-project` does the rest.
- **The suite can now prove driver-specific behaviour.** The starter uses none yet; an app
  that relies on accent folding, `timestamptz` or functional indexes tests them where they run.
- **Tests are slower than `:memory:`.** Accepted: the descendants already pay it and the
  suite runs through TIA.
- **ADR 0012's free per-worktree database is gone.** It relied on sqlite making the database
  a file inside the tree. Herd now creates and drops a Postgres database per workspace, and
  `herd.yml` owns the test database.
- **Descendants still on sqlite are not moved.** Under ADR 0008's copy-and-drift model they
  take this when they choose to; `.ai/rules/database.md` describes the arrangement they adopt.
- **The `_test` suffix is a requirement**, not a habit. An app naming its test database
  anything else must change the guard too.
