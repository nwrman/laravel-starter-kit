#!/usr/bin/env bash
# Tear down what worktree-setup.sh provisioned for THIS worktree: the Herd site
# and, on server databases, both of its databases. Run from inside the worktree
# AFTER its PR merged, BEFORE deleting the worktree itself.
#
# Deleting the worktree is deliberately not done here — do it from outside
# (`supacode worktree delete`, or `git worktree remove`), since removing the
# tree you are standing in kills the session.

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

kebab() { printf '%s' "$1" | tr -cs 'a-zA-Z0-9' '-' | tr '[:upper:]' '[:lower:]' | sed 's/^-//;s/-$//'; }
snake() { printf '%s' "$1" | tr -cs 'a-zA-Z0-9' '_' | tr '[:upper:]' '[:lower:]' | sed 's/^_//;s/_$//'; }

PROJECT="$(kebab "$(basename "$MAIN")")"
DB_PREFIX="$(snake "$(basename "$MAIN")")"

# Must derive the exact same names as worktree-setup.sh — see the note there.
BRANCH="$(git branch --show-current)"
TICKET="$(printf '%s' "$BRANCH" | sed -n 's/^t\([0-9][0-9]*\).*$/\1/p')"
if [ -n "$TICKET" ]; then
  SLUG="t-${TICKET}"
  DBSLUG="t${TICKET}"
else
  SLUG="$(kebab "$BRANCH")"
  DBSLUG="$(snake "$BRANCH")"
fi
SITE="${PROJECT}-${SLUG}"
DB="${DB_PREFIX}_${DBSLUG}"

# An absent key is normal — see the note in worktree-setup.sh.
envval() {
  local file="${2:-$MAIN/.env}"
  [ -f "$file" ] || return 0
  grep -E "^[[:space:]]*$1=" "$file" | tail -1 | sed 's/^[^=]*=//;s/^"//;s/"$//' || true
}

CONNECTION="$(envval DB_CONNECTION)"; CONNECTION="${CONNECTION:-sqlite}"

herd unlink "$SITE" 2>/dev/null || true

case "$CONNECTION" in
  sqlite)
    # The sqlite file lives inside the worktree and dies with it.
    echo "✓ torn down: site $SITE (sqlite file goes with the worktree)"
    ;;

  pgsql)
    export PGHOST="$(envval DB_HOST)"; PGHOST="${PGHOST:-127.0.0.1}"
    export PGPORT="$(envval DB_PORT)"; PGPORT="${PGPORT:-5432}"
    export PGUSER="$(envval DB_USERNAME)"; PGUSER="${PGUSER:-postgres}"
    PGPASS="$(envval DB_PASSWORD)"
    if [ -n "$PGPASS" ]; then export PGPASSWORD="$PGPASS"; fi

    dropdb --if-exists "$DB"
    dropdb --if-exists "${DB}_test"
    echo "✓ torn down: site $SITE, dbs $DB / ${DB}_test"
    ;;

  mysql|mariadb)
    MYSQL_HOST="$(envval DB_HOST)"; MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    MYSQL_PORT="$(envval DB_PORT)"; MYSQL_PORT="${MYSQL_PORT:-3306}"
    MYSQL_USER="$(envval DB_USERNAME)"; MYSQL_USER="${MYSQL_USER:-root}"
    MYSQL_PASS="$(envval DB_PASSWORD)"
    if [ -n "$MYSQL_PASS" ]; then export MYSQL_PWD="$MYSQL_PASS"; fi

    mysql --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
      -e "DROP DATABASE IF EXISTS \`$DB\`; DROP DATABASE IF EXISTS \`${DB}_test\`;"
    echo "✓ torn down: site $SITE, dbs $DB / ${DB}_test"
    ;;

  *)
    echo "Unsupported DB_CONNECTION '$CONNECTION' — site unlinked, databases left alone." >&2
    ;;
esac

echo "  now delete the worktree from outside: supacode worktree delete  (or git worktree remove '$WT_ROOT')"
