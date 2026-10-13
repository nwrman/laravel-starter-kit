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

## Warm a worktree's TIA cache from main's; re-pin main's baseline only on main
Pest keys the TIA cache by repo identity read from `<root>/.git/config`; in a worktree `.git` is a file, so the key falls back to the worktree's path and every ticket would start with an empty graph. `worktree-setup.sh` copies main's in, `worktree-teardown.sh` deletes the worktree's, and `scripts/tia-helper.php` answers the paths through Pest's own Storage/Fingerprint classes. Call the helper by ABSOLUTE path to main's copy: a tree cut from an older main may lack it, and the failure reads like "main has no graph".

Copy BOTH `graph.json` and `coverage.bin.gz` — Pest re-records whenever the coverage cache is missing. Only copy a cache written by a green run.

Every branch diffs against the default branch's baseline sha, so `refresh-main.sh` re-records when the fingerprint is stale OR the pinned sha != HEAD. Never re-stamp the sha without a real run: Pest replays cached results for skipped tests, so a sha advanced without re-measuring reports green from the old measurement.

## Teardown drops the whole database family, forcefully
Pest --parallel clones the test database once per process (`<db>_test_test_7`), so dropping only the app and test names leaves a dozen behind. `worktree-teardown.sh` lists every `<db>` / `<db>_test*` and drops each; on Postgres with `dropdb --force`, because one live connection — the worktree's own session holding a Boost query open is enough — otherwise fails the drop, and `set -e` would abandon the rest of the teardown. Failed drops are collected and reported, not fatal mid-loop.

## refresh-main migrates but never re-seeds
`scripts/refresh-main.sh` pulls, installs, migrates, builds and re-pins TIA. It does not seed or import, deliberately: re-running seeders or importers on every merge would overwrite what people typed. A ticket that ships new seed or import data therefore leaves main with the new columns and none of the new rows — the screen looks broken while every test is green. Whoever lands such a ticket names the command that writes the data in the handoff; do not add it to refresh-main.sh.

## The build-loop scripts ship executable
The starter once committed `worktree-setup.sh`, `worktree-teardown.sh` and `refresh-main.sh` as 100644, so the loop's first command failed with "permission denied" in every fresh clone, and each descendant fixed it on its own. This repo's git has `core.fileMode=false`, so `chmod +x` alone is invisible to git: use `git update-index --chmod=+x <file>`. Check with `git ls-files -s scripts/` — the mode must read 100755.
