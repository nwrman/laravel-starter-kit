#!/usr/bin/env bash
# Keep the main checkout — http://<project>.test — the standing latest.
# Run on the MAIN checkout after every merge (/finish-ticket calls this).
#
# It migrates but never re-seeds: a ticket that ships new seed or import data
# leaves main's database with the new columns and none of the new rows. Name
# the command that writes them in the ticket's handoff rather than adding it
# here — re-seeding on every merge would overwrite what people typed.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail

MAIN="$(git worktree list --porcelain | head -1 | sed 's/^worktree //')"
cd "$MAIN"

git pull --ff-only
composer install --quiet
bun install --silent
php artisan migrate --force
bun run build

# On a server database the main checkout needs its own .env.testing like any
# worktree, or the suite resolves the development database. Sqlite projects run
# on phpunit's forced :memory: and need none.
CONNECTION="$(grep -E '^[[:space:]]*DB_CONNECTION=' .env 2>/dev/null | tail -1 | sed 's/^[^=]*=//' || true)"
if [ -n "$CONNECTION" ] && [ "$CONNECTION" != "sqlite" ] && [ ! -f .env.testing ] && [ -f .env.testing.example ]; then
  cp .env.testing.example .env.testing
  echo "✓ wrote .env.testing (main checkout) — create its database if it does not exist yet"
fi

# Keep main's TIA graph warm AND pinned to HEAD. Every new worktree copies it,
# and the sha it carries is the baseline those worktrees diff against.
#
# Two reasons to re-record:
#
#  1. The fingerprint is stale — a changed composer.lock, phpunit.xml, vite
#     config or bun.lock. Pest invalidates the graph itself on these.
#
#  2. The baseline sha has fallen behind HEAD. Pest has every branch read the
#     default branch's baseline, so a worktree cut from main diffs its working
#     tree against that sha, not against the commit it branched from. Left
#     behind, every ticket opens by re-running tests for work that already
#     merged — measured in a descendant: 32 commits back, 185 affected test
#     files on a tree that had changed nothing.
#
# Re-pin here, never by re-stamping the sha in a worktree: Pest replays cached
# results for tests it skips, so a sha advanced without a run that re-measured
# would report green from the old measurement.
#
# A coverage run cannot record the graph, so this is a plain TIA run:
# composer test:fast, not composer preflight.
BRANCH="$(git branch --show-current)"
PINNED="$(php scripts/tia-helper.php sha "$(pwd)" "$BRANCH" 2>/dev/null || true)"
if ! php scripts/tia-helper.php valid "$(pwd)" 2>/dev/null; then
  echo "→ recording main's TIA graph (stale or missing; new worktrees copy this)"
  composer test:fast
elif [ "$PINNED" != "$(git rev-parse HEAD)" ]; then
  echo "→ re-pinning main's TIA baseline to $(git rev-parse --short HEAD) (was ${PINNED:0:7})"
  echo "  so the next worktree diffs against main, not against work already merged"
  composer test:fast
else
  echo "✓ TIA graph is current"
fi

echo "✓ $(basename "$MAIN").test is at $(git rev-parse --short HEAD)"
