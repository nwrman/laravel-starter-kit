#!/usr/bin/env bash
# Hand the end of a ticket back to the main checkout.
#
# Run from INSIDE the ticket's worktree, after `scripts/worktree-teardown.sh`.
# A session cannot delete the tree it is standing in, so this opens a session
# in main running /finish-ticket, which deletes this worktree — and, with it,
# the session that called this. That is expected: everything worth keeping is
# already on GitHub by then.
#
# In a Supacode session the main-checkout session opens in a tab by itself.
# Anywhere else the command to run there is printed.
#
# Usage: scripts/handoff-to-main.sh <ticket>
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
# shellcheck source=scripts/supacode-ids.sh
source scripts/supacode-ids.sh

TICKET="${1:?usage: handoff-to-main.sh <ticket>}"
case "$TICKET" in
  ''|*[!0-9]*) echo "Ticket must be a number, got '$TICKET'." >&2; exit 1 ;;
esac

MAIN="$(main_checkout)"
if [ "$(pwd)" = "$MAIN" ]; then
  echo "This IS the main checkout — nothing to hand off. Run /finish-ticket here instead." >&2
  exit 1
fi

WT_PATH="$(pwd)"

if ! supacode_available; then
  echo "No Supacode session — in a terminal on the main checkout, run:"
  echo
  echo "  cd '$MAIN' && $CLAUDE \"/finish-ticket $TICKET $WT_PATH\""
  exit 0
fi

# Both IDs are derived from git, never from SUPACODE_* — those go stale and have
# pointed at an unrelated repository mid-session. See scripts/supacode-ids.sh.
MAIN_ID="$(supacode_id_for_path "$MAIN")"
WT_ID="$(supacode_this_worktree_id)"

echo "→ handing t$TICKET back to main"
echo "  this worktree: $WT_ID"

supacode tab new \
  --worktree "$MAIN_ID" \
  --title "finish t$TICKET" \
  --input "$CLAUDE \"/finish-ticket $TICKET $WT_ID\"" \
  >/dev/null

echo "✓ a session is finishing t$TICKET in the main checkout."
echo "  It deletes this worktree, so this tab is about to end. That is expected."
