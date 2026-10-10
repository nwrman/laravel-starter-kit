#!/usr/bin/env bash
# Provision this git worktree as a self-contained dev environment:
# its own database(s), its own Herd site, cloned build caches.
#
# Run from INSIDE the worktree root (a Supacode setup script, the build-ticket
# loop, or by hand). Idempotent — safe to re-run.
#
# Naming is derived from the MAIN checkout's directory name, so nothing here is
# project-specific:  <project>-t-<N>.test  /  <project>_t<N>  /  <project>_t<N>_test
#
# Modes (content for the app database):
#   seed  (default)  migrate from zero + DatabaseSeeder
#   clone            copy the MAIN checkout's dev database — for phases that
#                    must run against real content instead of demo data
#
# Database engines: sqlite (default), pgsql, mysql/mariadb. For sqlite the test
# database is phpunit's forced :memory:, so no test DB and no .env.testing are
# provisioned — see the test-isolation section of .ai/guidelines/enforce-tests.
#
# Usage: scripts/worktree-setup.sh [seed|clone]

# Uses bash arrays; re-exec if invoked as `sh script` / `zsh script`.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail

MODE="${1:-seed}"
case "$MODE" in
  seed|clone) ;;
  *) echo "Unknown mode '$MODE' (use: seed | clone)" >&2; exit 1 ;;
esac

WT_ROOT="$(git rev-parse --show-toplevel)"
cd "$WT_ROOT"

# The main working tree is the first entry of `git worktree list`.
MAIN="$(git worktree list --porcelain | head -1 | sed 's/^worktree //')"
if [ "$MAIN" = "$WT_ROOT" ]; then
  echo "This IS the main checkout — nothing to provision." >&2
  exit 1
fi

kebab() { printf '%s' "$1" | tr -cs 'a-zA-Z0-9' '-' | tr '[:upper:]' '[:lower:]' | sed 's/^-//;s/-$//'; }
snake() { printf '%s' "$1" | tr -cs 'a-zA-Z0-9' '_' | tr '[:upper:]' '[:lower:]' | sed 's/^_//;s/_$//'; }

# Herd names a site after its directory, so the main checkout's basename is the prefix.
PROJECT="$(kebab "$(basename "$MAIN")")"
DB_PREFIX="$(snake "$(basename "$MAIN")")"

# Slug from the branch: t33-user-import → t-33 → site <project>-t-33, db <project>_t33
# Extracted with sed rather than [[ =~ ]] + BASH_REMATCH: under a non-bash shell the
# capture would come back empty and EVERY ticket would collide on <project>-t-.
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
DB_TEST="${DB}_test"

# --- env helpers -------------------------------------------------------------

# envval KEY [FILE] — read a key from an env file (defaults to main's .env).
# An absent key is normal (the starter ships DB_DATABASE commented out), so the
# trailing `|| true` keeps grep's exit 1 from tripping `set -e` at the call site.
envval() {
  local file="${2:-$MAIN/.env}"
  [ -f "$file" ] || return 0
  grep -E "^[[:space:]]*$1=" "$file" | tail -1 | sed 's/^[^=]*=//;s/^"//;s/"$//' || true
}

# setenv KEY VALUE FILE — replace the key (commented or not) or append it.
setenv() {
  if grep -qE "^[[:space:]]*#?[[:space:]]*$1=" "$3"; then
    sed -i '' -E "s|^[[:space:]]*#?[[:space:]]*$1=.*|$1=$2|" "$3"
  else
    printf '\n%s=%s\n' "$1" "$2" >> "$3"
  fi
}

CONNECTION="$(envval DB_CONNECTION)"; CONNECTION="${CONNECTION:-sqlite}"

echo "→ worktree:  $WT_ROOT"
echo "→ site:      http://${SITE}.test"
if [ "$CONNECTION" = "sqlite" ]; then
  echo "→ database:  sqlite (worktree-local file)  [mode: $MODE]"
else
  echo "→ database:  $DB (+ ${DB_TEST}) on $CONNECTION  [mode: $MODE]"
fi

# 1. Build caches: APFS copy-on-write clones from main, then true-up. ----------
for DIR in vendor node_modules; do
  if [ ! -d "$DIR" ] && [ -d "$MAIN/$DIR" ]; then
    echo "→ cloning $DIR from main (cp -c)"
    cp -Rc "$MAIN/$DIR" "$DIR"
  fi
done
composer install --quiet
bun install --silent

# 2. .env: copy main's, override the per-worktree keys. ------------------------
if [ ! -f .env ]; then
  cp "$MAIN/.env" .env
fi
setenv APP_URL "http://${SITE}.test" .env

# 3. Databases. ---------------------------------------------------------------
case "$CONNECTION" in
  sqlite)
    # Resolve main's sqlite file the way Laravel does: DB_DATABASE, else database/database.sqlite.
    MAIN_SQLITE="$(envval DB_DATABASE)"
    case "$MAIN_SQLITE" in
      "")  MAIN_SQLITE="$MAIN/database/database.sqlite" ;;
      /*)  ;;
      *)   MAIN_SQLITE="$MAIN/$MAIN_SQLITE" ;;
    esac

    WT_SQLITE="$WT_ROOT/database/database.sqlite"
    # An absolute DB_DATABASE inherited from main would point back at main's file.
    if [ -n "$(envval DB_DATABASE .env)" ]; then
      setenv DB_DATABASE "$WT_SQLITE" .env
    fi

    case "$MODE" in
      seed)
        [ -f "$WT_SQLITE" ] || touch "$WT_SQLITE"
        php artisan migrate --force --seed
        ;;
      clone)
        if [ ! -f "$MAIN_SQLITE" ]; then
          echo "Cannot clone: main has no database at $MAIN_SQLITE" >&2; exit 1
        fi
        echo "→ cloning $MAIN_SQLITE → $WT_SQLITE"
        cp "$MAIN_SQLITE" "$WT_SQLITE"
        php artisan migrate --force   # branch migrations on top of the clone
        ;;
    esac
    ;;

  pgsql)
    export PGHOST="$(envval DB_HOST)"; PGHOST="${PGHOST:-127.0.0.1}"
    export PGPORT="$(envval DB_PORT)"; PGPORT="${PGPORT:-5432}"
    export PGUSER="$(envval DB_USERNAME)"; PGUSER="${PGUSER:-postgres}"
    # `[ -n "$x" ] && export …` would be a failing AND-list under `set -e` when empty.
    PGPASS="$(envval DB_PASSWORD)"
    if [ -n "$PGPASS" ]; then export PGPASSWORD="$PGPASS"; fi
    MAIN_DB="$(envval DB_DATABASE)"

    setenv DB_DATABASE "$DB" .env

    createdb_if_missing() {
      psql -tAc "SELECT 1 FROM pg_database WHERE datname='$1'" postgres | grep -q 1 || createdb "$1"
    }
    createdb_if_missing "$DB_TEST"

    case "$MODE" in
      seed)
        createdb_if_missing "$DB"
        php artisan migrate --force --seed
        ;;
      clone)
        dropdb --if-exists "$DB"
        createdb "$DB"
        echo "→ cloning $MAIN_DB → $DB"
        pg_dump "$MAIN_DB" | psql -q "$DB"
        php artisan migrate --force
        ;;
    esac
    ;;

  mysql|mariadb)
    MYSQL_HOST="$(envval DB_HOST)"; MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    MYSQL_PORT="$(envval DB_PORT)"; MYSQL_PORT="${MYSQL_PORT:-3306}"
    MYSQL_USER="$(envval DB_USERNAME)"; MYSQL_USER="${MYSQL_USER:-root}"
    MYSQL_PASS="$(envval DB_PASSWORD)"
    if [ -n "$MYSQL_PASS" ]; then export MYSQL_PWD="$MYSQL_PASS"; fi
    MAIN_DB="$(envval DB_DATABASE)"
    MYSQL_ARGS=(--host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER")

    setenv DB_DATABASE "$DB" .env

    mysql "${MYSQL_ARGS[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_TEST\`"

    case "$MODE" in
      seed)
        mysql "${MYSQL_ARGS[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB\`"
        php artisan migrate --force --seed
        ;;
      clone)
        mysql "${MYSQL_ARGS[@]}" -e "DROP DATABASE IF EXISTS \`$DB\`; CREATE DATABASE \`$DB\`;"
        echo "→ cloning $MAIN_DB → $DB"
        mysqldump "${MYSQL_ARGS[@]}" "$MAIN_DB" | mysql "${MYSQL_ARGS[@]}" "$DB"
        php artisan migrate --force
        ;;
    esac
    ;;

  *)
    echo "Unsupported DB_CONNECTION '$CONNECTION'. Add a branch for it here and in worktree-teardown.sh." >&2
    exit 1
    ;;
esac

# 4. Per-worktree .env.testing — parallel suites must never share a test DB. ---
# Sqlite projects run on phpunit's forced :memory:, so they need neither.
if [ "$CONNECTION" != "sqlite" ]; then
  if [ -f "$MAIN/.env.testing.example" ]; then
    cp "$MAIN/.env.testing.example" .env.testing
  else
    cp .env .env.testing
    setenv APP_ENV testing .env.testing
  fi
  setenv DB_DATABASE "$DB_TEST" .env.testing
fi

# 5. Herd site + a first build. -----------------------------------------------
if [ ! -e "$HOME/Library/Application Support/Herd/config/valet/Sites/$SITE" ]; then
  herd link "$SITE"
fi
bun run build

echo "✓ ready: http://${SITE}.test"
