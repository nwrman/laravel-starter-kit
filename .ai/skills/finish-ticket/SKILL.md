---
name: finish-ticket
description: Delete a finished ticket's worktree from the main checkout, prune its branch, refresh main, and close the ticket with the account from its landing note. Spawned automatically at the end of build-ticket (scripts/handoff-to-main.sh) — you do not normally type it. Use when asked to finish, land the teardown of, or clean up after a ticket by number.
---

# Finish a ticket

The last phase of the build loop, and the only one that cannot run inside the
worktree — a session standing in a tree cannot delete the tree it is standing in.
`build-ticket` step 13 runs `scripts/handoff-to-main.sh`, which opens a session in the
main checkout running this, and then dies with the worktree.

Arguments: the ticket number, and the worktree that build-ticket handed over — a
Supacode worktree ID in a Supacode session, an absolute path otherwise.

**This runs in the main checkout.** If `git rev-parse --show-toplevel` is not the
first entry of `git worktree list`, stop: something spawned this in the wrong place.

If the worktree argument is missing, find it in `git worktree list` by the ticket's
branch (`t<N>-…`, any type prefix). **Never** take it from `$SUPACODE_WORKTREE_ID`, which
goes stale mid-session and has pointed at an unrelated project. To turn a path into a
Supacode ID: `source scripts/supacode-ids.sh && supacode_id_for_path <path>`.

## 1 · Prove the work is safe before deleting anything

Deleting the worktree takes the local branch with it (`supacode worktree delete` removes
it outright). That is right for landed work and destructive for anything else, so
establish which case this is before touching it. Read the ticket's delivery mode first —
the Parent section names an integration branch, or it does not:

```bash
gh issue view <N> --json body,state,labels
```

- **PR mode** — `gh pr list --state merged --search "t<N>" --json number,mergeCommit,headRefName`,
  then `git log --oneline main..<branch>` (empty once merged).
- **Integration mode** — `git fetch origin <integration-branch>` and
  `git log --oneline origin/<integration-branch>..<branch>` (empty once landed). If it is
  not empty and the ticket is closed with its landing note, build-ticket left the merge to
  you: merge `<branch>` into `<integration-branch>` from a clean checkout of it, push the
  integration branch (never `main`), and continue. Teardown already ran, so this ticket
  published no TIA baseline; say so in the report — the next ticket on that branch starts
  with a full run.

Then:

- **Landed** — nothing ahead of its target. Continue.
- **Not landed, commits exist** — **stop and say so.** Deleting now throws the
  branch away. Push it (`git push -u origin <branch>`) and report that it is
  parked, or ask before discarding.
- **Not landed, no commits** — an abandoned ticket that built nothing. Safe to
  delete; skip the ticket-closing step below and make sure `in-progress` is off.

## 2 · Delete the worktree

```bash
supacode worktree delete --worktree <id>      # in a Supacode session
git worktree remove --force <path> && git branch -D <branch>   # otherwise
```

The Supacode call kills whatever is still running inside — including the build-ticket
session that spawned this — closes its tabs, removes the directory, drops the local
branch, and clears the entry from `git worktree list`. `-D` is safe on the plain-git path
only because step 1 proved the branch landed. Verify with `git worktree list`.

If the worktree is already gone, that is fine: confirm with `git worktree list` and
continue rather than treating it as a failure.

## 3 · Prune the remote branch

```bash
git fetch --prune && git branch -r --list 'origin/<branch>'
git push origin --delete <branch>   # only if the line above printed something
```

With `delete_branch_on_merge` on, GitHub usually removes it at merge time. It survives
when the merge could not pass `--delete-branch` — exactly the case when the branch was
checked out in a worktree — and always in integration mode, where no PR merged it. Never
assume; check.

## 4 · Refresh main

```bash
scripts/refresh-main.sh
```

The main checkout's site becomes the standing latest. There is no TIA step: the ticket's
teardown already published its baseline for the next ticket on its base.

## 5 · Close the ticket with the account from the landing note

The session that did the work is gone, and so is everything it did not write down.
What it did write down is the landing note, which opens with **what now exists**
(build-ticket step 12 requires it). That is the account — lift it, do not invent one.

- **PR mode** — the note is the PR body:

  ```bash
  gh pr view <PR> --json body
  gh issue close <N> --comment "<the 'what now exists' section, plus the PR link>"
  ```

  Skip the close if `Closes #<N>` already closed it; still post the comment if the
  ticket has no account on it.
- **Integration mode** — build-ticket already posted the note on the ticket and closed
  it. Confirm it did; if the ticket is still open, close it with the note's account.

Closing the ticket releases the `in-progress` label naturally. If there is no such
section, say so plainly in the comment rather than writing a summary from the diff — a
thin account is a signal about the run, and papering over it hides that the loop
skipped a step.

## 6 · Report

What landed (the merge commit, or the integration branch's new head), what was deleted,
where main now stands, and the ticket link. Then say what is unblocked: the tickets whose
blockers just all closed. Suggest `/retro` if the ticket hit a round cap or a gate
needed more than one pass — what slowed it is cheapest to capture now.
