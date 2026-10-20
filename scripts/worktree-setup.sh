#!/usr/bin/env bash
# Provision this git worktree as a self-contained dev environment:
# its own database(s), its own Herd site, cloned build caches, the base branch's TIA baseline.
#
# Run from INSIDE the worktree root (the tab scripts/start-ticket.sh opens, or
# by hand). Idempotent — safe to re-run.
#
# Names come from scripts/worktree-names.sh: ticket 33 on a repo in
# `<project>/` gets http://t33.<project>.test and <project>_t33 (+ _test).
#
# Modes (content for the app database):
#   seed  (default)  migrate, then DatabaseSeeder — only when the database is
#                    new, so a re-run just migrates instead of seeding twice
#   clone            copy the MAIN checkout's dev database AND its uploaded
#                    files — for tickets that must run against real content
#
# Database engines: sqlite (default), pgsql, mysql/mariadb. For sqlite the test
# database is phpunit's forced :memory:, so no test DB and no .env.testing are
# provisioned — see the test-isolation section of the toolkit's "Running Tests"
# guideline (vendor/nwrman/laravel-toolkit/resources/boost/guidelines/core.blade.php).
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

# shellcheck source=scripts/worktree-names.sh
source "$WT_ROOT/scripts/worktree-names.sh"
worktree_names "$MAIN" "$(git branch --show-current)"

# --- env helpers -------------------------------------------------------------

# envval KEY [FILE] — read a key from an env file (defaults to main's .env).
# An absent key is normal (the starter ships DB_DATABASE commented out), so the
# trailing `|| true` keeps grep's exit 1 from tripping `set -e` at the call site.
# POSIX classes, not `\s`: BSD grep has none, and keys can carry leading space.
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
# The overrides run on every pass, not only when the file is created: a new
# worktree is not a clean checkout. Supacode copies untracked and ignored files
# across from the source checkout, so .env can arrive already pointing at main.
if [ ! -f .env ]; then
  cp "$MAIN/.env" .env
fi
setenv APP_URL "http://${SITE}.test" .env
php artisan storage:link --quiet 2>/dev/null || true

# Clone main's uploaded files onto this worktree's disks (clone mode only).
#
# A database carries paths, not bytes. Clone the rows alone and every upload
# they name 404s — which is precisely what a clone-mode ticket exists to look
# at. `cp -Rc` is an APFS copy-on-write clone: gigabytes cost no disk and no
# measurable time until a file diverges. A copy and not a symlink, deliberately
# — deleting an upload in this worktree must not reach into main's files.
clone_storage() {
  local sub
  for sub in private public; do
    [ -d "$MAIN/storage/app/$sub" ] || continue
    echo "→ cloning storage/app/$sub from main ($(du -sh "$MAIN/storage/app/$sub" | cut -f1 | tr -d ' \t'))"
    rm -rf "${WT_ROOT:?}/storage/app/$sub"
    mkdir -p "$WT_ROOT/storage/app"
    if ! cp -Rc "$MAIN/storage/app/$sub" "$WT_ROOT/storage/app/$sub" 2>/dev/null; then
      # Different volume, or no clonefile(2): a real copy rather than a
      # half-cloned tree.
      rm -rf "${WT_ROOT:?}/storage/app/$sub"
      cp -R "$MAIN/storage/app/$sub" "$WT_ROOT/storage/app/$sub"
    fi
  done
}

# migrate_and_seed FRESH — seed only a database this run created.
migrate_and_seed() {
  if [ "$1" = 1 ]; then
    php artisan migrate --force --seed
  else
    php artisan migrate --force
  fi
}

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
        FRESH=0
        if [ ! -f "$WT_SQLITE" ]; then touch "$WT_SQLITE"; FRESH=1; fi
        migrate_and_seed "$FRESH"
        ;;
      clone)
        if [ ! -f "$MAIN_SQLITE" ]; then
          echo "Cannot clone: main has no database at $MAIN_SQLITE" >&2; exit 1
        fi
        echo "→ cloning $MAIN_SQLITE → $WT_SQLITE"
        cp "$MAIN_SQLITE" "$WT_SQLITE"
        php artisan migrate --force   # branch migrations on top of the clone
        clone_storage
        ;;
    esac
    ;;

  pgsql)
    PGHOST="$(envval DB_HOST)"; export PGHOST="${PGHOST:-127.0.0.1}"
    PGPORT="$(envval DB_PORT)"; export PGPORT="${PGPORT:-5432}"
    PGUSER="$(envval DB_USERNAME)"; export PGUSER="${PGUSER:-postgres}"
    # `[ -n "$x" ] && export …` would be a failing AND-list under `set -e` when empty.
    DB_PASS="$(envval DB_PASSWORD)"
    if [ -n "$DB_PASS" ]; then export PGPASSWORD="$DB_PASS"; fi
    MAIN_DB="$(envval DB_DATABASE)"

    setenv DB_DATABASE "$DB" .env

    pg_exists() { psql -tAc "SELECT 1 FROM pg_database WHERE datname='$1'" postgres | grep -q 1; }
    pg_exists "$DB_TEST" || createdb "$DB_TEST"

    case "$MODE" in
      seed)
        FRESH=0
        if ! pg_exists "$DB"; then createdb "$DB"; FRESH=1; fi
        migrate_and_seed "$FRESH"
        ;;
      clone)
        dropdb --force --if-exists "$DB"
        createdb "$DB"
        echo "→ cloning $MAIN_DB → $DB"
        pg_dump "$MAIN_DB" | psql -q "$DB"
        php artisan migrate --force
        clone_storage
        ;;
    esac
    ;;

  mysql|mariadb)
    MYSQL_HOST="$(envval DB_HOST)"; MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    MYSQL_PORT="$(envval DB_PORT)"; MYSQL_PORT="${MYSQL_PORT:-3306}"
    MYSQL_USER="$(envval DB_USERNAME)"; MYSQL_USER="${MYSQL_USER:-root}"
    DB_PASS="$(envval DB_PASSWORD)"
    if [ -n "$DB_PASS" ]; then export MYSQL_PWD="$DB_PASS"; fi
    MAIN_DB="$(envval DB_DATABASE)"
    MYSQL_ARGS=(--host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER")

    setenv DB_DATABASE "$DB" .env

    mysql_exists() { [ -n "$(mysql "${MYSQL_ARGS[@]}" -N -e "SHOW DATABASES LIKE '$1'")" ]; }
    mysql "${MYSQL_ARGS[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_TEST\`"

    case "$MODE" in
      seed)
        FRESH=0
        if ! mysql_exists "$DB"; then
          mysql "${MYSQL_ARGS[@]}" -e "CREATE DATABASE \`$DB\`"; FRESH=1
        fi
        migrate_and_seed "$FRESH"
        ;;
      clone)
        mysql "${MYSQL_ARGS[@]}" -e "DROP DATABASE IF EXISTS \`$DB\`; CREATE DATABASE \`$DB\`;"
        echo "→ cloning $MAIN_DB → $DB"
        mysqldump "${MYSQL_ARGS[@]}" "$MAIN_DB" | mysql "${MYSQL_ARGS[@]}" "$DB"
        php artisan migrate --force
        clone_storage
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
  setenv APP_URL "http://${SITE}.test" .env.testing
  # The template ships likely defaults, not this machine's. Carry over what
  # the database step just connected with, or the suite talks to a different
  # server than the one holding its database.
  for KEY in DB_HOST DB_PORT DB_USERNAME DB_PASSWORD; do
    VALUE="$(envval "$KEY")"
    if [ -n "$VALUE" ]; then setenv "$KEY" "$VALUE" .env.testing; fi
  done
fi

# 5. Herd site + a first build. -----------------------------------------------
if [ ! -e "$HOME/Library/Application Support/Herd/config/valet/Sites/$SITE" ]; then
  herd link "$SITE"
fi
bun run build

# 6. Inherit the base branch's TIA baseline. ----------------------------------
#
# The last ticket that landed on this branch's base published its final
# preflight cache — a complete baseline at a commit already in this branch's
# history. Inheriting it means the first `composer test` replays only what this
# ticket changes, and preflight replays instead of re-recording. Nothing is
# recorded here: with no usable baseline on file, the first `composer test`
# does the full run. See docs/adr/0015.
#
# Pest keys the cache by the worktree's own path (`.git` is a file here), so
# this tree starts with an empty one either way. Runs last: artisan needs
# composer install and .env in place.
php artisan toolkit:tia inherit

echo "✓ ready: http://${SITE}.test"
