---
name: build-ticket
description: Run one build ticket through the full implementation loop — worktree, TDD implementation, spec-conformance verification, impeccable UX self-review, PR, adversarial code review — then stop for a human merge. Use when asked to work, implement, or build a ticket by number (e.g. "/build-ticket 33"), or bare ("/build-ticket") to take the next ready ticket off the frontier.
---

# Build a ticket

Runs ONE GitHub ticket of a staged build through the agreed loop. The routing lives
here, in writing — agents fill the jobs, never the plan.

Assumes the ticket graph described in `reference/spec-and-tickets.md`: one spec issue,
one issue per ticket, `Blocked by` edges, and markers in the acceptance criteria.

**Hard rules (task-graph guardrails):**

- Never merge a PR. Never push to `main`. A human merges every PR by hand.
- One writer per file: only the implementer edits code. Verifier and reviewers are read-only;
  their findings route back to the implementer.
- Every verify/fix cycle caps at **3 rounds**; if still failing, stop and report.
- A ticket whose body carries a **`🛑 GATE`** marker ends in a live review session with the
  human on the worktree's Herd site *before* the PR is opened. Do not skip to the PR.

## 0 · Preflight

1. **No ticket number given?** Compute the frontier: open `ready-for-agent` issues **without
   the `in-progress` label** whose "Blocked by" issues are all closed. Exactly one → take it
   and say so. Several → list them one line each and ask which (one question, options, no
   essay). None → report what's blocking and stop.
2. `gh issue view <N>` — read the full ticket. Confirm every "Blocked by" issue is CLOSED;
   if not, stop and say which blockers are open. If it already carries `in-progress`,
   **stop — another agent owns it** (unless a human explicitly says to take it over).
3. **Claim it** before touching anything:
   `gh issue edit <N> --add-label in-progress` and comment
   `Claimed — branch t<N>-<name>, <date>`. The label is the lock; the comment says who to
   ask. Release it (`--remove-label in-progress`) whenever this run ends without a merged
   PR — blocked, failed, or abandoned — so the ticket returns to the frontier. Closing the
   ticket after the merge releases it naturally.
4. Read the parent build spec issue the ticket links to, plus any spec/design documents the
   acceptance criteria name.
5. Read the project's standing rules: every file whose globs match the paths in scope per
   `.ai/rules/index.md` if that directory exists, otherwise `CLAUDE.md` and `.ai/guidelines/`.
6. Note the two body markers: `🛑 GATE` (human UX session before the PR) and `🗄️ CLONE`
   (provision the worktree against real data instead of demo seed data).

## 1 · Worktree

Branch name: `t<N>-<short-kebab-name>` (e.g. `t33-user-import`).

- In a Supacode session: `WT_ID=$(supacode repo worktree-new --branch t<N>-<name> --base main --fetch)`.
  Otherwise: `git worktree add <path> -b t<N>-<name>`.
- Inside the worktree: `scripts/worktree-setup.sh seed` — or `scripts/worktree-setup.sh clone`
  when the ticket carries `🗄️ CLONE`, i.e. it must run on real content, never demo data.
- Everything from here happens inside the worktree. The site is
  `http://<repo-directory-name>-t-<N>.test` (the script prints it).

## 2 · TDD implementation

Invoke the `tdd` skill and work red-green-refactor against the ticket's acceptance criteria.
Non-negotiables from the standing contracts:

- The tests rules bind: Feature is the default suite, Unit for pure logic,
  **permutations down the stack** (one feature test per wiring path; case matrices as
  datasets at the cheapest level that can falsify the logic).
- `composer test:*` wrappers only; single-test debugging via `--filter`. A `PreToolUse`
  guard blocks bare `pest` / `phpunit` / `php artisan test`.
- Every other rule the project records — naming, source language, theme, ID strategy —
  per the rule files read in Preflight.
- Finish with `vendor/bin/pint --dirty --format agent` and a green `composer preflight`.

## 3 · Spec-conformance verification (fresh context)

Spawn a **subagent that has not seen the implementation reasoning**. Its brief: read the
ticket, the parent spec and the mapped spec chapters and wireframes — then attack the
worktree's built result for divergence: missing fields, wrong states, copy that isn't the
spec's copy, behavior that contradicts a stated rule. It reports findings only; the
implementer fixes; re-verify. Max 3 rounds.

## 4 · Impeccable self-review (UI tickets only)

If the ticket has a user-facing surface: invoke the `impeccable` skill against the running
Herd site. Fix findings. Record the final verdict — it goes in the PR body. No human in
this step; the human reviews UX only at `🛑 GATE` tickets.

## 5 · Pull request

- `🛑 GATE` tickets: **stop here first** — live session with the human on the worktree
  site; iterate until sign-off; only then continue.
- Open the PR with the `finish-feature-branch` skill (or `gh pr create`): title
  `t<N>: <ticket title>`, body linking the ticket, the acceptance criteria as a checked
  list, the verifier's verdict, and the impeccable verdict.

## 6 · Adversarial code review

Run the `code-review` skill against the PR (Standards + Spec axes). The implementer fixes
confirmed findings; re-review. Max 3 rounds; unresolved PLAUSIBLE findings get listed in a
PR comment for the human's judgment.

## 7 · Stop — and after the merge

Report: PR URL, verdicts, anything unresolved. **Wait.** The human merges.

If the run ends *without* a merged PR — a round cap hit, a blocker found, the work
abandoned — drop the claim first: `gh issue edit <N> --remove-label in-progress`. A ticket
left labelled is a ticket no other agent will pick up.

After the merge (when told, or when the PR shows merged):

1. `scripts/worktree-teardown.sh` inside the worktree (drops its Herd site + databases).
2. Delete the worktree **from outside it**: `supacode worktree delete` or
   `git worktree remove <path>`.
3. `scripts/refresh-main.sh` — the main checkout becomes the standing latest site.
4. Close the ticket with a comment linking the PR.
