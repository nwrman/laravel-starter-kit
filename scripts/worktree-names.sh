#!/usr/bin/env bash
# The names a worktree gets — site, databases — derived from git alone.
#
# Source this; do not execute it. worktree-setup.sh and worktree-teardown.sh
# both source it, so the names they compute cannot drift apart: a teardown
# that derives a different name than setup did walks away leaving the site and
# databases standing.
#
# Naming derives from the MAIN checkout's directory name and the branch, so
# nothing here is project-specific. For a repo in `laravel-starter-kit/`:
#
#   branch feature/t33-user-import → site t33.laravel-starter-kit.test
#                                    db   laravel_starter_kit_t33 (+ _test)
#
# The type prefix (feature/, fix/, chore/…) is optional and never reaches the
# slug. Branches without a t<N> fall back to a slug of the whole branch name.
#
# The site is a SUBDOMAIN of the main checkout's site, not a sibling of it.
# `<project>-t32.test` and `<project>-t33.test` are separate registrable
# domains, so Chrome files their saved passwords separately and a credential
# typed in one worktree is unreachable from the next. Under one parent domain
# they share an eTLD+1, and Chrome offers the saved credential on every
# worktree. Herd (Valet) resolves a dotted link name to exactly this. Sessions
# stay isolated: with SESSION_DOMAIN null the cookie is pinned to the exact
# host, so one worktree's login is not another's.

kebab() { printf '%s' "$1" | tr -cs 'a-zA-Z0-9' '-' | tr '[:upper:]' '[:lower:]' | sed 's/^-//;s/-$//'; }
snake() { printf '%s' "$1" | tr -cs 'a-zA-Z0-9' '_' | tr '[:upper:]' '[:lower:]' | sed 's/^_//;s/_$//'; }

# worktree_ticket BRANCH — the ticket number, or nothing. Matches t33 and
# t33-anything, prefixed or not; never t330 for t33, never `testing`.
worktree_ticket() {
  printf '%s' "$1" | sed -nE 's#^(.*/)?t0*([0-9]+)(-.*)?$#\2#p'
}

# worktree_names MAIN_PATH BRANCH — sets PROJECT, TICKET, SLUG, SITE,
# LEGACY_SITE, DB and DB_TEST for the caller.
worktree_names() {
  local main="$1" branch="$2"

  PROJECT="$(kebab "$(basename "$main")")"
  TICKET="$(worktree_ticket "$branch")"

  if [ -n "$TICKET" ]; then
    SLUG="t${TICKET}"
  else
    SLUG="$(kebab "$branch")"
  fi

  SITE="${SLUG}.${PROJECT}"
  DB="$(snake "$(basename "$main")")_$(snake "$SLUG")"
  DB_TEST="${DB}_test"

  # The name this starter used before the subdomain scheme. A worktree created
  # then is still linked under it, so teardown unlinks both.
  if [ -n "$TICKET" ]; then
    LEGACY_SITE="${PROJECT}-t-${TICKET}"
  else
    LEGACY_SITE="${PROJECT}-${SLUG}"
  fi
}
