---
paths:
  - 'scripts/**'
---

# Scripts

## A ticket's worktree is git's, adopted by Herd — never Herd's own clone
The factory plugin's `factory-start-ticket` runs `git worktree add` under `~/.worktrees/<repo>/`, then `herd workspace` *inside* it, and Herd adopts it: serves it at `https://<branch, / as ->.<site>.test`, copies `.env`, `vendor`, `node_modules` and main's built assets, and rewrites `APP_URL` (and `SESSION_DOMAIN` only when it names the parent's host). Running `herd workspace <name>` from the main checkout instead makes a copy-on-write clone under Herd's own folder, outside `git worktree list`, based on whatever main is on, with its branch tracking `origin/main` — a bare `git push` aims at main. Measured in the #30 spike.

`herd workspace:delete` has to run from the main checkout: run inside the worktree it removes the folder but leaves the workspace registered, and the next start for that branch fails with "is already the workspace".

## Herd ignores a failing hook line, so the factory checks a marker
Herd runs `herd.yml` hooks line by line and carries on after a failing one without a word (a `false` line was followed by the next line running, and no warning, in the #30 spike). So each hook is one strict `bash -c 'set -eux; …'` line writing its trace to `storage/logs/herd-after-create.log`, and `after_create` ends by touching `factory-setup-done` in the worktree's git dir. `factory-start-ticket` refuses to open the ticket's tab without the marker and prints the failing command from the trace.

## TIA baselines flow from landed tickets, through the toolkit
A new worktree inherits its base branch's TIA baseline (`php artisan toolkit:tia inherit` in the Product's `herd.yml` `after_create`); teardown publishes the ticket's final one back to the base (`toolkit:tia publish` in `before_delete`), before Herd deletes the worktree. `factory-start-ticket` records the base in `branch.<branch>.tiaBase`, so both know it. The worktree is cut from the base's local state: pull the base first if the inherited commit must be the latest. The logic lives in `nwrman/laravel-toolkit`, not in `scripts/`: it reads Pest internals that move with Pest releases. ADR 0015 has the reasoning.

Nothing records a baseline up front, and `refresh-main.sh` runs no tests. Pest keys a worktree's cache by its own path (`.git` is a file there), so ask Pest for the directory (`PAO_DISABLE=1 vendor/bin/pest --baseline`) rather than deriving the key; without `PAO_DISABLE` laravel/pao wraps the path in JSON when an agent runs it.

## refresh-main migrates but never re-seeds
`scripts/refresh-main.sh` pulls, installs, migrates and builds. It does not seed or import, deliberately: re-running seeders or importers on every merge would overwrite what people typed. A ticket that ships new seed or import data therefore leaves main with the new columns and none of the new rows — the screen looks broken while every test is green. Whoever lands such a ticket names the command that writes the data in the handoff; do not add it to refresh-main.sh.

## Teardown drops the whole database family, forcefully
Pest --parallel clones the test database once per process (`<db>_test_test_7`), so dropping only the app and test names leaves a dozen behind. A Postgres Product's `herd.yml` `before_delete` lists every `<db>_test*` and drops each with `dropdb --force`, because one live connection — the worktree's own session holding a Boost query open is enough — otherwise fails the drop. Herd drops the app database itself.

## The build-loop scripts ship executable
The starter once committed its worktree scripts and `refresh-main.sh` as 100644, so the loop's first command failed with "permission denied" in every fresh clone, and each descendant fixed it on its own. This repo's git has `core.fileMode=false`, so `chmod +x` alone is invisible to git: use `git update-index --chmod=+x <file>`. Check with `git ls-files -s scripts/` — the mode must read 100755.
