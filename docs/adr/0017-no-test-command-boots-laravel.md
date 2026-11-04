# 17. No test command boots Laravel; browser specs get their own gate

Date: 2026-11-03

## Status

Accepted. Replaces two clauses: [ADR 0016](0016-postgres-is-the-only-database.md)'s
"the `toolkit:*` composer scripts pass `--env=testing`", and
[ADR 0015](0015-tia-baselines-flow-from-landed-tickets.md)'s "browser specs stay in the coverage
run". The rest of both stands.

## Context

Up to toolkit 0.4, every test command ran Pest under an artisan parent (`toolkit:report`,
`toolkit:retry`, `toolkit:preflight`). That parent loads `.env`, and its `DB_DATABASE` reached
the Pest child, where it beats `.env.testing`. ADR 0016 answered with `--env=testing` on every
such script, and with the `_test` guard in `Tests\TestCase`. The flag is a thing each caller
has to remember: every command the toolkit printed for a human or an agent to paste lacked it.
One Minuta run logged 2,570 failures against its development database; the starter's guard
refused the same kind of run.

Under load the same machinery failed in other ways (measured in nwrman/laravel-toolkit#19, Oct
13–30, mostly on Minuta's 3,300 tests):

- Browser specs timed out at 5 s inside a full preflight, beside 18 coverage workers, lint,
  types and Vite. Each one passed alone. That cost 5–20 minutes on almost every ticket since
  Oct 23.
- `--retry` re-ran the whole coverage gate rather than the failed tests.
- A gate failing early still waited for every other gate to finish.

## Decision

**No test command boots Laravel.** Toolkit v1 runs Pest from the shell. `phpunit.xml` forces
`APP_ENV=testing`, so Laravel loads `.env.testing`, and nothing exports `.env`'s `DB_DATABASE`
first. A Pest plugin writes the failure report and re-runs failed tests (`--toolkit-retry`),
and `vendor/bin/preflight` reads `config/toolkit.php` without booting the app. The starter's
scripts call Pest, Vitest and `preflight` directly, and **no test command passes
`--env=testing`**.

**The `migrate --env=testing` steps keep the flag.** `post-create-project-cmd`, `herd.yml`'s
`after_create` and `scripts/refresh-main.sh` use it to create and migrate the `_test` database.
They start no Pest, so `.env`'s values have no test run to reach. Without the flag, `migrate`
would act on the development database instead.

**The `_test` guard in `Tests\TestCase` stays.** It still catches a missing `.env.testing`
and a `DB_DATABASE` exported in the shell, which beats `.env.testing` too.

**Browser specs run in their own gate, without coverage.** The `browser` gate starts after
`pest-coverage` passes, with Xdebug off and 4 workers. Coverage comes from the Unit and Feature
suites (`--toolkit-no-browser` leaves the Browser suite out without making the run a partial
selection, so TIA stays on). A line that only a browser spec reached gets a feature test: the
starter had one, `LogoutResponse`, now covered by `tests/Feature/Auth/LogoutTest.php`.

**The coverage gate keeps TIA, on Xdebug.** Dropping TIA from the gate would cost Minuta
4–5.5 minutes per preflight, against 12–37 s for a typical small change; CI's full run without
TIA stays the check that nothing was missed. PCOV was measured on Herd's PHP over Minuta's full
coverage run: 185–204 s against Xdebug's 221 s, the same coverage file by file. 8–16 % faster,
but Herd does not ship PCOV and it needs a rebuild for every PHP minor, so it is not adopted.

## Consequences

- **A test command pasted from anywhere is safe.** `vendor/bin/pest`, the per-test commands the
  failure report prints, and `composer test*` all read `.env.testing`.
- **The guard hook is gone** (`.claude/settings.json`). A raw Pest run now writes the report and
  uses TIA, which is everything the hook was enforcing.
- **Preflight stops at the first failing gate**, and `--retry` / `--gate=` print every gate's
  row, so a run just to get the full table is never needed.
- **Browser specs no longer count toward the 100 % coverage minimum.** Covering a page prop
  through a browser visit stops working; use `assertInertia` in a feature test.
- **Descendants move when they choose to** (ADR 0008). Each adds feature tests for the lines
  only its browser specs covered: Minuta had 67 lines in 12 files.
