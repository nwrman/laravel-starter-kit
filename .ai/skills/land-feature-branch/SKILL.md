---
name: land-feature-branch
description: Use when a pull request has been approved and needs to be merged into main. Activates when user says "land", "merge PR", "merge pull request", "land the branch", or wants to complete the PR lifecycle and clean up.
---

# Land Feature Branch

## Overview

Merge an approved PR into `main` via GitHub, then clean up local branches and remote refs.

## Workflow

### 1. Determine Which PR to Land

**If on a feature branch:**

```bash
branch=$(git branch --show-current)
```

Use the current branch's PR.

**If on `main` or another branch:**

List open PRs and ask the user:

```bash
gh pr list --state open
```

```
Which PR would you like to land? (enter PR number)
```

### 2. Verify PR is Mergeable

```bash
gh pr view <number> --json state,mergeable,mergeStateStatus,reviewDecision
```

Check:
- `state` is `OPEN`
- `mergeable` is `MERGEABLE`

**If not mergeable, stop:**

```
PR #<N> is not mergeable. Resolve conflicts or get approval first.
```

### 3. Merge the PR

```bash
gh pr merge <number> --merge --delete-branch
```

- `--merge` — merge commit to preserve full commit history. Never squash: a ticket lands as several
  commits on purpose.
- `--delete-branch` — deletes the remote branch on GitHub.

**Worktree caveat.** If the branch is checked out in a git worktree, `--delete-branch` fails — `gh`
cannot switch away from a branch another worktree holds. Merge without it:

```bash
gh pr merge <number> --merge
```

With `delete_branch_on_merge` on (see `finish-feature-branch`, Merge Convention), GitHub deletes the
remote branch server-side at merge time. Confirm rather than assume, and clean up by hand if it survived:

```bash
git fetch --prune && git branch -r --list 'origin/<feature-branch>'
git push origin --delete <feature-branch>   # only if the line above printed something
```

### 4. Switch to Main and Pull

```bash
git checkout main
git pull origin main
```

**In a worktree this fails** — `main` is checked out in the main checkout, so `git checkout main` is
refused. Run `scripts/refresh-main.sh` instead; it `cd`s to the main checkout itself and brings it up to
date. Then continue there.

### 5. Clean Up Local Branch

```bash
git branch -d <feature-branch>
```

If the branch can't be deleted (not fully merged), report the issue and stop — don't force delete.

A branch held by a worktree cannot be deleted either. For a build-loop ticket, `/finish-ticket` deletes
the worktree and its branch together, and this step becomes a no-op.

### 6. Prune Stale Remote Refs

```bash
git remote prune origin
```

### 7. Confirm

```
PR #<N> merged into main.
Local branch <name> deleted.
Remote refs pruned.

You're on main, up to date.
```

## Quick Reference

| Step | Command | Blocks on failure? | In a worktree |
|------|---------|-------------------|---------------|
| Find PR | `gh pr list` or current branch | — | same |
| Verify mergeable | `gh pr view --json` | Yes | same |
| Merge | `gh pr merge --merge --delete-branch` | Yes | drop `--delete-branch` |
| Switch | `git checkout main && git pull` | Yes | `scripts/refresh-main.sh` |
| Local cleanup | `git branch -d <branch>` | Report only | `/finish-ticket` does it |
| Remote cleanup | `git remote prune origin` | — | same |

The fourth column is what to do instead when the branch lives in a git worktree.

## Common Mistakes

- **Force-deleting branches** — use `-d` not `-D`. If it fails, something is wrong.
- **Forgetting to pull after merge** — local `main` won't have the merged commits.
- **Leaving stale remote refs** — `git remote prune origin` keeps things tidy.
- **Merging without checking status** — always verify the PR is mergeable first.
- **Assuming the remote branch is gone** — when the merge ran without `--delete-branch`, check
  `git branch -r` before calling the lifecycle finished.

## Integration

**Preceded by:** `finish-feature-branch` (creates the PR)
**Completes the lifecycle:** `create-feature-branch` → `finish-feature-branch` → `land-feature-branch`
