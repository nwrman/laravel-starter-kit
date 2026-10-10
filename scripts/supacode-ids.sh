#!/usr/bin/env bash
# Supacode identity, derived from git rather than from the environment, and the
# command a spawned ticket tab starts Claude with.
#
# Source this; do not execute it.
#
# WHY THIS EXISTS. Supacode's CLI defaults --repo to $SUPACODE_REPO_ID and
# --worktree to $SUPACODE_WORKTREE_ID, and BOTH GO STALE. Measured in one
# descendant session: the variable named that project at the start and an
# unrelated one an hour later, with no repo switch in between, while
# `supacode worktree list --focused` still reported the truth. Trusting the
# variable created a ticket worktree inside the unrelated project.
#
# So: every supacode call in this repo passes an explicit --repo/--worktree,
# and the IDs come from here. A Supacode ID is the URL-encoded absolute path
# with a trailing slash; each derived ID is checked against the app's own list
# before use.

# How a spawned tab launches Claude. A tab nobody is watching must not stop on
# a prompt, so by default it skips permission prompts and the Chrome
# integration's per-path offer. The project's MCP server is pre-approved in
# .claude/settings.json (enabledMcpjsonServers), which is the third prompt a
# fresh worktree would raise. Set BUILD_LOOP_CLAUDE to change it per machine,
# e.g. BUILD_LOOP_CLAUDE=claude to keep the prompts.
CLAUDE="${BUILD_LOOP_CLAUDE:-claude --dangerously-skip-permissions --no-chrome}"

# The main checkout: always the first entry of `git worktree list`.
main_checkout() {
  git worktree list --porcelain | head -1 | sed 's|^worktree ||'
}

# Encode a filesystem path as a Supacode ID.
supacode_id_for_path() {
  printf '%s/' "${1%/}" | sed 's|/|%2F|g'
}

# The repo ID: always the MAIN checkout, whichever worktree we are standing in.
supacode_repo_id() {
  supacode_id_for_path "$(main_checkout)"
}

# This worktree's own ID.
supacode_this_worktree_id() {
  supacode_id_for_path "$(git rev-parse --show-toplevel)"
}

# Succeed when the supacode CLI is present and knows this repo. Presence of
# SUPACODE_* is NOT the test — those exist (wrongly populated) in any Supacode
# terminal, and are absent in a plain one.
supacode_available() {
  command -v supacode >/dev/null 2>&1 \
    && supacode repo list 2>/dev/null | grep -qxF "$(supacode_repo_id)"
}
