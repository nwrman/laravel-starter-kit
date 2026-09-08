# 13. sqlite is the default test driver, and the Postgres path ships complete

Date: 2026-08-13

## Status

Accepted

## Context

ANIDIGRAF's #30 ([`SEAPTIdev/anidigraf-members#51`](https://github.com/SEAPTIdev/anidigraf-members/pull/51))
moved that app onto Postgres. The database work itself was routine. What was not routine
was everything the starter had quietly built on top of sqlite, which had to be found one
failure at a time:

- `phpunit.xml` pinned `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:` with `force="true"`.
  Nothing can override a forced value — not `.env.testing`, not the per-worktree database
  `worktree-setup.sh` provisions. Switching meant knowing which two lines to delete.
- Off sqlite there is no isolation at all. `composer test` runs through
  `php artisan toolkit:report`, an artisan parent that loads `.env`; `RefreshDatabase` then
  drops whatever that points at. The starter's own testing guideline documents the
  workaround rather than shipping the guard.
- `.env.example`'s commented database block is MySQL-shaped (`DB_PORT=3306`,
  `DB_USERNAME=root`), so it is not a template for the switch it is nominally there for.
- `worktree-setup.sh` copies `.env.testing.example` when it exists and silently falls back
  to duplicating `.env` when it does not. The starter has never shipped that file.
- Two CI lanes (`build`, `static_checks`) copy `.env.example` and run no database service.
  Harmless while the example is sqlite; a latent red lane the moment a descendant switches.

None of that is a Postgres problem. It is the starter having made a default load-bearing
without saying so, and then not shipping the way out.

The obvious correction — make Postgres the default, as ANIDIGRAF did — was considered and
rejected. It costs every fresh clone a running database server before anything works, and
it buys correctness only for apps that would have switched anyway. sqlite's real value here
is not speed: it is that `composer create-project` through `composer test` has no external
prerequisite, and that ADR 0012's worktree loop gets its per-ticket database for free as a
file inside the tree.

Supporting both drivers as equal, CI-verified paths was also rejected. Two proven paths is
two lanes to keep green in a pipeline that had been red for five consecutive runs without
anyone noticing.

## Decision

**sqlite stays the default test driver.** A fresh clone boots, migrates, seeds and tests
with nothing installed. ADR 0012's worktree provisioning keeps its sqlite fast path.

**The Postgres path ships complete rather than being rediscovered.** Concretely:

- `.env.example` carries a correct, commented Postgres block.
- `.env.testing.example` is committed — the file `worktree-setup.sh` already reaches for.
- `phpunit.xml`'s sqlite pin is written so it can be removed as a unit, not unpicked.
- A guard, inert on sqlite and armed automatically off it, refuses to run the suite unless
  the database name ends in `_test`. That suffix is not new: `worktree-setup.sh` already
  names test databases `<db>_test`.
- The `build` and `static_checks` CI lanes neutralise the driver after copying `.env`, so
  they need no database whatever `.env.example` says.
- The switch is a written procedure in `.ai/rules`, not a command. A command would be
  testable, which is its attraction, but it is also code to keep working against a file
  whose shape descendants edit freely.

**The Postgres path is not CI-verified in the starter.** It is shipped and documented, not
proven on every PR. This is recorded rather than glossed: it is a known rot risk, accepted
because a second lane in an unwatched pipeline is not the mechanism that would catch it.

The mechanism that would is separate and general: scaffolding self-checks that fail loudly
when the starter's own configuration goes stale, travelling into every descendant as tests
rather than as notes. Those are not specific to the database choice and are not this ADR's
subject.

## Consequences

- **A descendant on Postgres still edits starter files.** This is the copy-and-drift model
  of ADR 0008 working as intended. What changes is that the edits are a named procedure
  instead of a week of discovery.
- **Nothing here reaches ANIDIGRAF.** It already made all of these edits its own way. The
  starter's version is for the next descendant, and the two will differ in detail.
- **The `_test` suffix becomes convention rather than habit.** `worktree-setup.sh` already
  produced it; the guard now depends on it. An app that names its test database anything
  else must change the guard as well.
- **The sqlite default remains a claim nothing verifies about production.** Tests prove the
  app works on sqlite. Any driver-specific behaviour — accent folding, `timestamptz`,
  functional indexes, `unaccent` — is invisible to the starter's suite by construction.
  That is the price of the zero-prerequisite clone, and apps relying on such behaviour
  should switch early rather than late.
- **Two drivers, one CI shape.** Because the lanes that do not need a database no longer
  assume one, a descendant's switch touches the test lane only.
