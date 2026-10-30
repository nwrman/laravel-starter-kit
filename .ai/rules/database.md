---
paths:
  - phpunit.xml
  - .env.example
  - .env.testing.example
  - herd.yml
  - tests/TestCase.php
  - '.github/workflows/**'
---

# Database

## Postgres, always — and the suite never touches the development database
Postgres is the only database: development, tests, worktrees and CI (ADR 0016). There is no sqlite fallback to keep working. The CI lanes that set `DB_CONNECTION=sqlite` / `:memory:` do so as a "no database" stub for an artisan boot that never queries, not as a supported path.

**How the test database is pinned.** `phpunit.xml` forces `DB_CONNECTION=pgsql` and deliberately does **not** force `DB_DATABASE`. The name comes from the checkout's own `.env.testing`, so parallel worktrees never share a test database. Pinning `DB_DATABASE` there would put every worktree on one database, and their runs would wipe each other.

**Three layers keep `RefreshDatabase` off the development database.** Each was proved by running it, with a marker table in the dev database that survived every case:

- `.env.testing` names `<app database>_test`. Laravel loads it *instead of* `.env` when `APP_ENV=testing`, so it carries every key the suite needs. It is gitignored. Every checkout writes its own from the committed `.env.testing.example`: `composer create-project`, `herd.yml`'s `after_create` for a worktree, and `scripts/refresh-main.sh` for the main checkout. Its throwaway `APP_KEY` and passkey secret are committed on purpose: the file only ever names a `_test` database.
- The `toolkit:*` composer scripts pass `--env=testing`. Without it, the artisan parent loads `.env` and exports its `DB_DATABASE` to the Pest child process, where it beats `.env.testing`. The suite then resolves the development database even though `.env.testing` exists.
- `Tests\TestCase::refreshApplication()` refuses to run unless the resolved database name ends in `_test`. It checks before the traits boot, so the run dies ahead of the first migration. That is the backstop for a missing `.env.testing` or a script without the flag. An app that names its test database anything else must change the guard too.

The toolkit's general guidance for this lives in its "Test-database isolation" guideline (`vendor/nwrman/laravel-toolkit/resources/boost/guidelines/core.blade.php`); this rule is the starter's concrete arrangement of it.

**Creating the databases is `migrate`'s job.** `php artisan migrate --force` creates a missing Postgres database itself (`MigrateCommand::createMissingMySqlOrPgsqlDatabase`), and `migrate --env=testing --force` does the same for the test database. Dropping needs `dropdb --force` from DBngin's tools, because Laravel has no command that drops a database.

**Worktrees.** Herd gives each worktree `<main database>_<branch>`. If it can't create that database, it quietly **falls back to sharing main's database**, with only a printed note. `herd.yml`'s `after_create` refuses that case before doing anything else, so the setup marker is never written and the ticket never opens. A worktree that seeds or tests against main's database destroys work. Herd drops the app database on `workspace:delete`. `before_delete` drops the `_test` database and Pest's `--parallel` copies (`<test db>_test_<n>`), and refuses any name that does not end in `_test`.

**CI** writes `.env.testing` from the template with anchored `sed` and runs a Postgres 18 service. `tests/Unit/Scaffolding/EnvTestingTemplateTest.php` asserts the template still carries every key those `sed` lines target. An anchored `sed` on a renamed key matches nothing, and CI silently keeps the template's value.
