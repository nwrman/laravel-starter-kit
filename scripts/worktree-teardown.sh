#!/usr/bin/env bash
# Tear down what worktree-setup.sh provisioned for THIS worktree: the Herd site,
# on server databases every database it owns, and its TIA cache — after
# publishing the ticket's TIA baseline for the next ticket on its base. Run from
# inside the worktree AFTER its ticket landed, BEFORE deleting the worktree.
#
# Deleting the worktree is deliberately not done here — removing the tree you
# are standing in kills the session. scripts/handoff-to-main.sh hands that to
# /finish-ticket in the main checkout.

# Re-exec if invoked as `sh script` / `zsh script` — see worktree-setup.sh.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail

WT_ROOT="$(git rev-parse --show-toplevel)"
cd "$WT_ROOT"

MAIN="$(git worktree list --porcelain | head -1 | sed 's/^worktree //')"
if [ "$MAIN" = "$WT_ROOT" ]; then
  echo "Refusing to tear down the main checkout." >&2
  exit 1
fi

# The same names worktree-setup.sh derived — one source, so they cannot drift.
# shellcheck source=scripts/worktree-names.sh
source "$WT_ROOT/scripts/worktree-names.sh"
worktree_names "$MAIN" "$(git branch --show-current)"

# An absent key is normal — see the note in worktree-setup.sh.
envval() {
  local file="${2:-$MAIN/.env}"
  [ -f "$file" ] || return 0
  grep -E "^[[:space:]]*$1=" "$file" | tail -1 | sed 's/^[^=]*=//;s/^"//;s/"$//' || true
}

CONNECTION="$(envval DB_CONNECTION)"; CONNECTION="${CONNECTION:-sqlite}"

# Both names, on purpose. A worktree created before the subdomain scheme is
# still linked under the legacy name, and would otherwise be left standing.
# `herd unlink` on a name that was never linked exits 0, so asking twice is free.
herd unlink "$SITE" 2>/dev/null || true
herd unlink "$LEGACY_SITE" 2>/dev/null || true

# Pest --parallel clones the test database once per process
# (`<db>_test_test_7`), so dropping only the two names setup created leaves a
# dozen behind. Drop the whole family.
DROPPED=''
FAILED=''
case "$CONNECTION" in
  sqlite)
    # The sqlite file lives inside the worktree and dies with it.
    ;;

  pgsql)
    PGHOST="$(envval DB_HOST)"; export PGHOST="${PGHOST:-127.0.0.1}"
    PGPORT="$(envval DB_PORT)"; export PGPORT="${PGPORT:-5432}"
    PGUSER="$(envval DB_USERNAME)"; export PGUSER="${PGUSER:-postgres}"
    DB_PASS="$(envval DB_PASSWORD)"
    if [ -n "$DB_PASS" ]; then export PGPASSWORD="$DB_PASS"; fi

    # `_` is a LIKE wildcard, hence the backslash.
    DBS="$(psql -Atc "select datname from pg_database where datname = '$DB' or datname like '${DB}\_test%'" postgres)"
    # --force terminates open connections first. Without it a single live
    # client — the worktree's own session holding a Boost query open is enough —
    # fails the drop, and `set -e` would abandon the rest of the teardown with
    # the site already unlinked. That is how a descendant left 36 databases
    # standing across two tickets.
    while IFS= read -r db; do
      [ -n "$db" ] || continue
      if dropdb --force --if-exists "$db"; then DROPPED="$DROPPED $db"; else FAILED="$FAILED $db"; fi
    done <<< "$DBS"
    ;;

  mysql|mariadb)
    MYSQL_HOST="$(envval DB_HOST)"; MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    MYSQL_PORT="$(envval DB_PORT)"; MYSQL_PORT="${MYSQL_PORT:-3306}"
    MYSQL_USER="$(envval DB_USERNAME)"; MYSQL_USER="${MYSQL_USER:-root}"
    DB_PASS="$(envval DB_PASSWORD)"
    if [ -n "$DB_PASS" ]; then export MYSQL_PWD="$DB_PASS"; fi
    MYSQL_ARGS=(--host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER")

    DBS="$(mysql "${MYSQL_ARGS[@]}" -N -e "SHOW DATABASES" | grep -E "^${DB}(_test.*)?$" || true)"
    while IFS= read -r db; do
      [ -n "$db" ] || continue
      if mysql "${MYSQL_ARGS[@]}" -e "DROP DATABASE IF EXISTS \`$db\`"; then DROPPED="$DROPPED $db"; else FAILED="$FAILED $db"; fi
    done <<< "$DBS"
    ;;

  *)
    echo "Unsupported DB_CONNECTION '$CONNECTION' — site unlinked, databases left alone." >&2
    ;;
esac

# Hand this ticket's final TIA baseline to its base branch before the cache
# goes, so the next ticket cut from it inherits instead of re-recording. The
# toolkit publishes only a complete baseline whose commit is merged into the
# base, so a stalled ticket publishes nothing. See docs/adr/0015.
php artisan toolkit:tia publish || echo "⚠ could not publish the TIA baseline — the next ticket records its own" >&2

# The cache itself lives outside the repo, in ~/.pest/tia/, keyed by this
# worktree's own path. Nothing will ever read it once the tree is gone. Ask
# Pest for the directory rather than reconstructing the key; PAO_DISABLE keeps
# laravel/pao from wrapping the path in JSON when an agent runs this.
TIA_DIR="$(PAO_DISABLE=1 vendor/bin/pest --baseline 2>/dev/null | tail -1 || true)"
case "$TIA_DIR" in
  "$HOME"/.pest/tia/?*)
    rm -rf "$TIA_DIR"
    echo "✓ removed TIA cache: $TIA_DIR"
    ;;
esac

if [ -n "$FAILED" ]; then
  echo "⚠ could not drop:$FAILED — something still holds them open." >&2
  echo "  Everything else is torn down; re-run this script once they are idle." >&2
  exit 1
fi

echo "✓ torn down: site $SITE (and legacy $LEGACY_SITE, if it existed), databases:${DROPPED:- none}"
echo "  now hand off to main: scripts/handoff-to-main.sh <ticket>"
