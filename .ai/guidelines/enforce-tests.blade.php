# Running Tests

This project standardises on `composer test*` script aliases that wrap the `nwrman/laravel-toolkit` package. **Use them.**
They run through the toolkit, which emits a structured failure report you read instead of scrolling terminal output. Do
**not** shell out to `pest` / `phpunit` / `php artisan test` for full or per-suite runs.

- Every change must be programmatically tested: add or update a test, then run the tests.
- **Don't hand-pick a suite to go faster — Test Impact Analysis already does that, and does it better.** It selects by
  real dependency rather than by category, so it catches the feature and browser tests a "this is just a unit change"
  guess would miss. See the TIA section below.
  - **Backend PHP** (models, controllers, actions, migrations…): `composer test:fast`.
  - **Anything, or unsure**: `composer test` — full sweep, TIA-accelerated on the backend, with the failure report.
  - **Frontend React/TS only** (components, hooks, pages): `composer test:frontend`
    (or `bunx vitest run path/to/file.test.tsx`) — Vitest is not TIA-aware.

## Commands

Each command writes the same artifacts **only when something fails**. On a green run the toolkit prints `✓ All tests
passed!` and deletes the failure files so stale data never lingers.

- `storage/logs/test-failures.md` — markdown report: class, file, line, error, and a `--filter` re-run hint per failure.
- `storage/logs/test-failures.json` — same data, structured (feeds `composer test:retry`).
- `storage/logs/test-results.xml` — JUnit XML.

| Command | Runs |
| --- | --- |
| `composer test:unit` | The `Unit` suite. |
| `composer test:feature` | The `Feature` suite. |
| `composer test:browser` | The `Browser` suite. |
| `composer test:frontend` | The frontend (Vitest) suite. |
| `composer test` | All suites, with TIA replaying only the affected backend tests. The safe default. |
| `composer test:report` | Interactive picker — prompts which suites to run. |
| `composer test:retry` | Re-runs only the tests that failed last run (reads the JSON above). |
| `composer test:fast` | Whole backend suite, but replays only the tests your changes can reach (Pest TIA). Seconds instead of ~9s; sub-second when nothing changed. No failure report — use the wrappers above for that. |
| `composer test:ci` / `composer preflight` | Full gate: coverage + lint + types. The "is this branch ready?" check. |

## Test Impact Analysis

Configured in `tests/Pest.php`. Pest records which test touches which file, then
replays only the tests a change can actually reach — one edited file typically
drops 280 tests to ~100, and an unchanged tree runs nothing. Comment-only edits,
a Pint pass or a Prettier reformat hash identically and run zero tests.

**Picking a command:**

- `composer test:fast` — backend only, no failure report. The tightest loop:
  ~0.4s when nothing changed.
- `composer test` — everything, TIA on the backend plus the failure report and
  `test:retry`. The frontend (Vitest) suite is **not** TIA-aware and always runs
  in full, so expect several seconds regardless.
- `composer test:unit|feature|browser` — still available, but no longer the way
  to go faster. They pass `--testsuite`, which Pest treats as a partial
  selection and which disables TIA, so they run their whole suite every time.
  Reach for them when you want one suite's report specifically.

Prefer a full run over guessing a suite. Selecting by category can under-test:
editing a validation rule pulled in unit, feature *and* browser tests that no
single suite would have covered.

Nothing to gitignore — the graph lives in `~/.pest/tia/<project-key>/` and
rebuilds itself when `composer.lock`, `phpunit.xml`, the vite config or the node
lockfile change.

Trust it for the inner loop, not as the ship gate: `composer preflight` still
runs everything (Pest disables filtered replay under coverage, so `--exactly=100.0`
stays honest), and CI never uses TIA.

## After a failure

**Read `storage/logs/test-failures.md` instead of re-running the suite to scroll output.** It already has each failure's
class, file, line, error, and a ready-to-paste filter command. To iterate on one failing test while debugging, a
single-test filter is fine:

```shell
php artisan test --filter='TestName'
```

The `composer test:*` family is for full runs and for re-runs that feed the structured report.

## Test-database isolation (non-sqlite projects)

Because `composer test:*` runs `php artisan toolkit:report` — an artisan parent that loads `.env` — a non-sqlite project
must isolate its test database, or **tests will run against the dev DB**. Use one of:

- A committed **`.env.testing`** with the test DB, and `--env=testing` on the test scripts (the toolkit installer wires
  this automatically when `.env.testing` exists), **or**
- **force-pinned** `DB_*` in `phpunit.xml`, e.g. `<env name="DB_DATABASE" value="..." force="true"/>` (and `DB_CONNECTION`,
  `DB_HOST`, …).

Sqlite-in-memory projects (`DB_DATABASE=:memory:` forced in `phpunit.xml`) are already isolated and need neither.

## Guard hook

A `PreToolUse` guard (`.claude/hooks/enforce-test-command.php`) **blocks** direct `pest` / `phpunit` / `php artisan test`
and the bare `composer test`, redirecting to the wrappers. Single-test debugging with `--filter` is allowed. Reach for the
`composer test:*` wrappers first so you never hit it.

## Test path convention

Tests mirror the `app/` directory structure. The test for `app/Foo/Bar/Baz.php` lives at
`tests/{Unit|Feature}/Foo/Bar/BazTest.php`. Examples:

- `app/Actions/CreateUserPassword.php` → `tests/Unit/Actions/CreateUserPasswordTest.php`
- `app/Http/Controllers/SessionController.php` → `tests/Feature/Controllers/SessionControllerTest.php`
- `app/Models/User.php` → `tests/Unit/Models/UserTest.php`
