---
paths:
  - 'scripts/**'
---

# Scripts

## Derive Supacode IDs from git — the SUPACODE_* variables go stale
`supacode repo worktree-new` defaults `--repo` to `$SUPACODE_REPO_ID`, and `tab new` / `worktree delete` default `--worktree` to `$SUPACODE_WORKTREE_ID`. Both drift mid-session: in a descendant the variable named that project at the start and an unrelated one an hour later, and relying on the default created a ticket worktree inside the unrelated project.

Never pass those variables and never omit the flag. Source `scripts/supacode-ids.sh`: a Supacode ID is the URL-encoded absolute path with a trailing slash, derived from `git worktree list`, and `supacode_available` checks it against `supacode repo list`. Presence of `SUPACODE_*` is not evidence you are in the right repo.

## Worktree names come from one place, and the site is a subdomain
`worktree-setup.sh` and `worktree-teardown.sh` both source `scripts/worktree-names.sh`; never derive a site or database name inline. A teardown that computes a different name than setup did leaves the site and databases standing — a descendant left 36 databases behind that way.

Ticket N's site is `t<N>.<project>.test`, a subdomain of main's, not `<project>-t-<N>.test`: separate registrable domains make Chrome file saved passwords separately, so every ticket started by retyping the login. Sessions stay isolated because SESSION_DOMAIN is null (cookie pinned to the exact host). Teardown also unlinks `LEGACY_SITE`, the old sibling name, for worktrees created before the change; `herd unlink` on an unlinked name exits 0.

## A new worktree is not a clean checkout
Supacode copies untracked and ignored files across from the source checkout into a new worktree — `.env` arrives on its own, already pointing at main's site and database, and so does anything uncommitted. So `worktree-setup.sh` rewrites `APP_URL` and the database key on every run, not only when it creates `.env`, and build-ticket's step 2 re-reads both before trusting the tree.

## TIA baselines flow from landed tickets, through the toolkit
A new worktree inherits its base branch's TIA baseline (`php artisan toolkit:tia inherit` in `worktree-setup.sh`); teardown publishes the ticket's final one back to the base (`toolkit:tia publish` in `worktree-teardown.sh`), before the cache is deleted. `start-ticket.sh` records the base in `branch.<branch>.tiaBase` and fast-forwards the local base first, so the inherited commit is in the new branch's history — Pest ignores a baseline commit outside it. The logic lives in `nwrman/laravel-toolkit`, not in `scripts/`: it reads Pest internals that move with Pest releases. ADR 0015 has the reasoning.

Nothing records a baseline up front, and `refresh-main.sh` runs no tests. Pest keys a worktree's cache by its own path (`.git` is a file there), so ask Pest for the directory (`PAO_DISABLE=1 vendor/bin/pest --baseline`) rather than deriving the key; without `PAO_DISABLE` laravel/pao wraps the path in JSON when an agent runs it.

## Teardown drops the whole database family, forcefully
Pest --parallel clones the test database once per process (`<db>_test_test_7`), so dropping only the app and test names leaves a dozen behind. `worktree-teardown.sh` lists every `<db>` / `<db>_test*` and drops each; on Postgres with `dropdb --force`, because one live connection — the worktree's own session holding a Boost query open is enough — otherwise fails the drop, and `set -e` would abandon the rest of the teardown. Failed drops are collected and reported, not fatal mid-loop.

## refresh-main migrates but never re-seeds
`scripts/refresh-main.sh` pulls, installs, migrates and builds. It does not seed or import, deliberately: re-running seeders or importers on every merge would overwrite what people typed. A ticket that ships new seed or import data therefore leaves main with the new columns and none of the new rows — the screen looks broken while every test is green. Whoever lands such a ticket names the command that writes the data in the handoff; do not add it to refresh-main.sh.

## The build-loop scripts ship executable
The starter once committed `worktree-setup.sh`, `worktree-teardown.sh` and `refresh-main.sh` as 100644, so the loop's first command failed with "permission denied" in every fresh clone, and each descendant fixed it on its own. This repo's git has `core.fileMode=false`, so `chmod +x` alone is invisible to git: use `git update-index --chmod=+x <file>`. Check with `git ls-files -s scripts/` — the mode must read 100755.
