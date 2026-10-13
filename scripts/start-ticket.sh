#!/usr/bin/env bash
# Start a build ticket: create its worktree, then hand the work to a Claude
# session running INSIDE that worktree.
#
# Run from the main checkout. Main's whole job is to pick the ticket and name
# the branch; everything after that happens in a session launched in the
# worktree, where the working directory — and, critically, every MCP server —
# is rooted in the worktree rather than in main.
#
# That rooting is why this starts a new session instead of moving the current
# one. MCP servers start once, with the session's launch directory: .mcp.json
# runs `php artisan boost:mcp` by relative path, so a Boost booted in main keeps
# answering about main no matter where the session later moves. Measured in a
# descendant: a session that switched into a worktree still got main's APP_URL
# from get-absolute-url; a fresh `claude` launched in the worktree got its own.
#
# In a Supacode session the new session opens in a tab by itself. Anywhere
# else the worktree is created with plain git and the command to run in a new
# terminal is printed.
#
# Usage: scripts/start-ticket.sh <ticket> <branch> [seed|clone] [base]
#   scripts/start-ticket.sh 33 feature/t33-user-import
#   scripts/start-ticket.sh 45 feature/t45-first-round clone
#   scripts/start-ticket.sh 51 feature/t51-gallery seed feature/galleries   # integration branch
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
# shellcheck source=scripts/supacode-ids.sh
source scripts/supacode-ids.sh

USAGE='usage: start-ticket.sh <ticket> <branch> [seed|clone] [base]'
TICKET="${1:?$USAGE}"
BRANCH="${2:?$USAGE}"
MODE="${3:-seed}"
BASE="${4:-main}"

case "$TICKET" in
  ''|*[!0-9]*) echo "Ticket must be a number, got '$TICKET'." >&2; exit 1 ;;
esac
case "$MODE" in
  seed|clone) ;;
  *) echo "Mode must be seed or clone, got '$MODE'." >&2; exit 1 ;;
esac

MAIN="$(main_checkout)"
if [ "$(pwd)" != "$MAIN" ]; then
  echo "Run this from the main checkout ($MAIN), not from a worktree." >&2
  exit 1
fi

# The type prefix never reaches the folder name: feature/t33-user-import
# becomes t33-user-import. A slash in the name would nest the worktree.
NAME="${BRANCH##*/}"

# Reattach rather than create a second tree for the same ticket. Matches t33 and
# t33-anything, prefixed or not; never t330.
existing_worktree_path() {
  local line path='' branch
  while IFS= read -r line; do
    case "$line" in
      'worktree '*) path="${line#worktree }" ;;
      'branch '*)
        branch="${line#branch refs/heads/}"
        if [[ "$branch" =~ (^|/)t0*"$TICKET"(-|$) ]]; then
          printf '%s\n' "$path"
          return 0
        fi
        ;;
    esac
  done < <(git worktree list --porcelain)
  return 1
}

# The tab's first command provisions the tree, so this script never aims
# anything at another directory. `&&` keeps Claude from starting on a
# half-provisioned tree — the error stays on screen.
TAB_INPUT="scripts/worktree-setup.sh $MODE && $CLAUDE \"/build-ticket $TICKET\""

if ! supacode_available; then
  if WT_PATH="$(existing_worktree_path)"; then
    echo "→ reattaching to the existing worktree for t$TICKET ($WT_PATH)"
  else
    WT_PATH="$(dirname "$MAIN")/$(basename "$MAIN")-$NAME"
    echo "→ creating worktree $WT_PATH on $BRANCH (from $BASE)"
    git fetch --quiet origin "$BASE" 2>/dev/null || true
    git worktree add "$WT_PATH" -b "$BRANCH" "$BASE"
  fi
  echo
  echo "No Supacode session — open a new terminal and run:"
  echo
  echo "  cd '$WT_PATH' && $TAB_INPUT"
  exit 0
fi

REPO_ID="$(supacode_repo_id)"

if WT_PATH="$(existing_worktree_path)"; then
  WT_ID="$(supacode_id_for_path "$WT_PATH")"
  echo "→ reattaching to the existing worktree for t$TICKET ($(basename "$WT_PATH"))"
else
  echo "→ creating worktree $NAME on $BRANCH (from $BASE)"
  # --repo is passed explicitly: its default, $SUPACODE_REPO_ID, goes stale and
  # has aimed a worktree at an unrelated repository. See scripts/supacode-ids.sh.
  WT_ID="$(supacode repo worktree-new \
    --repo "$REPO_ID" \
    --branch "$BRANCH" \
    --base "$BASE" \
    --name "$NAME" \
    --fetch \
    --background)"
fi

if [ -z "$WT_ID" ]; then
  echo "Supacode returned no worktree id — nothing was started." >&2
  exit 1
fi

# The id must sit under THIS repo's worktree directory. A mis-targeted create
# is otherwise invisible until a tab opens in the wrong project.
case "$WT_ID" in
  *"$(basename "$MAIN")"*) ;;
  *) echo "Refusing to continue: worktree id '$WT_ID' is not under $(basename "$MAIN")." >&2
     exit 1 ;;
esac

supacode tab new \
  --worktree "$WT_ID" \
  --title "t$TICKET" \
  --input "$TAB_INPUT" \
  >/dev/null

echo "✓ t$TICKET is provisioning in its own tab; Claude starts there when it finishes."
echo "  worktree: $WT_ID"
