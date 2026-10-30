#!/usr/bin/env bash
# Keep the main checkout — http://<project>.test — the standing latest.
# Run on the MAIN checkout after every merge (the factory plugin's factory-teardown calls this).
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

# The main checkout needs its own .env.testing like any worktree, or the suite
# resolves the development database (Tests\TestCase refuses to run then). Write
# it once, naming <app database>_test, and let migrate create that database.
if [ ! -f .env.testing ]; then
  APP_DB="$(grep -E '^DB_DATABASE=' .env | tail -1 | cut -d= -f2- || true)"
  [ -n "$APP_DB" ] || { echo "✗ .env names no DB_DATABASE — cannot name main's test database" >&2; exit 1; }
  sed "s|^DB_DATABASE=.*|DB_DATABASE=${APP_DB}_test|" .env.testing.example > .env.testing
  php artisan migrate --env=testing --force
  echo "✓ wrote .env.testing (main checkout) for ${APP_DB}_test"
fi

# No TIA run here. A new ticket inherits the TIA baseline the last ticket that
# landed on its base published at teardown, so re-recording main would be a
# full run nobody reads. See docs/adr/0015.

echo "✓ $(basename "$MAIN").test is at $(git rev-parse --short HEAD)"
