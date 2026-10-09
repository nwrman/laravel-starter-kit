---
name: build-ticket
description: Run one build ticket through the full implementation loop — claim, workspace, TDD implementation, spec-conformance verification, impeccable UX self-review, adversarial code review — then land it (a PR for a human to merge, or commits on the spec's integration branch). Use when asked to work, implement, or build a ticket by number (e.g. "/build-ticket 33"), or bare ("/build-ticket") to take the next ready ticket off the frontier.
---

# Build a ticket

Runs ONE GitHub ticket of a staged build through the agreed loop. The routing lives
here, in writing — agents fill the jobs, never the plan.

Assumes the ticket graph described in `reference/spec-and-tickets.md`: one spec issue,
one issue per ticket (a GitHub sub-issue of the spec), native "blocked by" dependencies,
and markers in the acceptance criteria. Issue-tracker commands: `docs/agents/issue-tracker.md`.

**Hard rules (task-graph guardrails):**

- Never merge a PR. Never push to `main`. A human merges every PR by hand.
- One writer per file: only the implementer edits code. Verifier and reviewers are read-only;
  their findings route back to the implementer.
- Every verify/fix cycle caps at **3 rounds**; if still failing, stop and report.
- A ticket whose body carries a **`🛑 GATE`** marker ends in a live review session with the
  human on the ticket's Herd site *before* it lands. Do not skip it.

## 0 · Preflight

1. **No ticket number given?** Compute the frontier: open `ready-for-agent` issues **without
   the `in-progress` label** whose blockers are all closed. Exactly one → take it and say so.
   Several → list them one line each and ask which (one question, options, no essay).
   None → report what's blocking and stop.
2. `gh issue view <N>` — read the full ticket. Confirm every blocker is CLOSED; if not, stop
   and say which are open. If it already carries `in-progress`, **stop — another agent owns
   it** (unless a human explicitly says to take it over).

   Blockers are GitHub's native issue dependencies — `to-tickets` writes them that way:
   `gh api repos/{owner}/{repo}/issues/<N> --jq .issue_dependencies_summary.blocked_by`
   counts the open ones, and must be 0. A ticket written by hand may carry a `Blocked by #M`
   line in its body instead; treat each issue it names the same way.
3. **Pick the delivery mode** from the ticket body — never ask:
   - **Integration** — the Parent section names a branch ("ships on `feature/x`, the single
     PR for #M"). The ticket lands as commits on that branch; the spec ships as one PR later.
   - **PR** (default) — no integration branch named. The ticket gets its own PR off `main`.
4. **Pick the workspace:** a **worktree** (default) or **in place** on the current checkout
   when the human asks for it ("no worktree", "in this session"). In place + integration
   means working directly on the integration branch; in place + PR means a `t<N>-<name>`
   branch in the current checkout.
5. **Claim it** before touching anything:
   `gh issue edit <N> --add-label in-progress` and comment
   `Claimed — branch <branch>, <date>`. The label is the lock; the comment says who to ask.
   Release it (`--remove-label in-progress`) whenever this run ends without the ticket
   landing — blocked, failed, or abandoned — so it returns to the frontier.
6. Read the parent spec issue, plus any spec/design documents the acceptance criteria name.
7. Read the standing rules: every file whose globs match the paths in scope per
   `.ai/rules/index.md`, plus `CLAUDE.md` and `.ai/guidelines/`. Read `GLOSSARY.md` for the
   domain language and the ADRs in `docs/adr/` that touch the area.
8. Note the body markers: `🛑 GATE` (human UX session before landing) and `🗄️ CLONE`
   (provision the worktree against a copy of the real dev database instead of seed data).

## 1 · Workspace

Branch name: `t<N>-<short-kebab-name>` (e.g. `t33-user-import`), based on `main` in PR mode
or on the integration branch in integration mode.

- **Worktree:**
  - In a Supacode session: `WT_ID=$(supacode repo worktree-new --branch t<N>-<name> --base <base> --fetch)`.
    Otherwise: `git worktree add ../<repo>-t<N> -b t<N>-<name> <base>`.
  - Inside the worktree: `scripts/worktree-setup.sh seed` — or `scripts/worktree-setup.sh clone`
    when the ticket carries `🗄️ CLONE`, i.e. it must run on real content, never demo data.
    The script gives the worktree its own database(s), its own Herd site
    (`http://<repo-directory-name>-t-<N>.test`, printed at the end) and a first build.
  - Everything from here happens inside the worktree.
- **In place:** no provisioning. The site is the main checkout's `http://<repo-directory-name>.test`.
  If a dev server is already running, use it — do not start a second one, and do not run
  `bun run build` underneath it.

## 2 · TDD implementation

Call the Skill tool with `tdd` and work red → green against the ticket's acceptance criteria.
Confirm the seams with the human first unless the parent spec's Testing Decisions already
fix them. Non-negotiables from the standing contracts:

- The tests rules bind: Feature is the default suite, Unit for pure logic,
  **permutations down the stack** (one feature test per wiring path; case matrices as
  datasets at the cheapest level that can falsify the logic).
- `composer test:*` wrappers only; single-test debugging via `--filter`. A `PreToolUse`
  guard blocks bare `pest` / `phpunit` / `php artisan test`.
- Every other rule the project records — naming, source language, theme, ID strategy —
  per the rule files read in Preflight.
- Commit with Conventional Commits, referencing `#<N>`.
- Finish with `vendor/bin/pint --dirty --format agent` and a green `composer preflight`.

## 3 · Spec-conformance verification (fresh context)

Spawn a **subagent that has not seen the implementation reasoning**. Its brief: read the
ticket, the parent spec and any spec chapters and wireframes it names — then attack the
built result (the branch's diff against its base, and the running site) for divergence:
missing fields, wrong states, copy that isn't the spec's copy, behavior that contradicts a
stated rule. It reports findings only; the implementer fixes; re-verify. Max 3 rounds.

## 4 · Impeccable self-review (UI tickets only)

If the ticket has a user-facing surface: call the Skill tool with `impeccable` against the
running Herd site. Fix findings. Record the final verdict for the landing note. No human in
this step; the human reviews UX only at `🛑 GATE` tickets.

## 5 · Adversarial code review

Call the Skill tool with `code-review` on the ticket's changes (its branch against the base
it was cut from) — Standards + Spec axes. The implementer fixes confirmed findings;
re-review. Max 3 rounds; unresolved PLAUSIBLE findings are listed in the landing note for
the human's judgment.

## 6 · Land

`🛑 GATE` tickets: **stop here first** — live session with the human on the ticket's site;
iterate until sign-off; only then land.

**PR mode**

1. Push the branch and open the PR with the `finish-feature-branch` skill (or
   `gh pr create`). Title `t<N>: <ticket title>`. Call the Skill tool with `pr` for the
   body's shape, and include: `Closes #<N>`, the acceptance criteria as a checked list, the
   verifier's and impeccable verdicts, and any unresolved review findings.
2. Report the PR URL. **Wait.** The human merges.
3. After the merge (when told, or when the PR shows merged). The ticket closes through the PR.
   - Worktree: `scripts/worktree-teardown.sh` inside it (drops its Herd site and databases),
     then delete the worktree **from outside it** — `supacode worktree delete` or
     `git worktree remove <path>`.
   - Both workspaces: `scripts/refresh-main.sh`, so the main checkout is the standing latest site.

**Integration mode**

1. Worktree: merge the ticket branch into the integration branch (from the main checkout
   or a clean checkout of it), then teardown and delete the worktree as above. In place: the
   commits are already on it.
2. Push the integration branch (never `main`).
3. Tick the ticket's acceptance criteria, comment what was built and the verdicts, and
   close it (`gh issue close <N> --comment …`) — closing is what moves the next tickets
   onto the frontier. No PR per ticket: the integration branch ships as one PR when the
   spec is done.

If the run ends *without* landing — a round cap hit, a blocker found, the work
abandoned — drop the claim first: `gh issue edit <N> --remove-label in-progress`. A
ticket left labelled is a ticket no other agent will pick up.
