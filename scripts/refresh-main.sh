#!/usr/bin/env bash
# Keep the main checkout — http://<project>.test — the standing latest.
# Run on the MAIN checkout after every PR merge (the landing step of the
# build-ticket loop calls this).
set -euo pipefail

MAIN="$(git worktree list --porcelain | head -1 | sed 's/^worktree //')"
cd "$MAIN"

git pull --ff-only
composer install --quiet
bun install --silent
php artisan migrate --force
bun run build

echo "✓ $(basename "$MAIN").test is at $(git rev-parse --short HEAD)"
