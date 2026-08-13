# 12. Multi-agent build loop: worktrees, the issue tracker as state machine

Date: 2026-08-12

## Status

Accepted

## Context

The ANIDIGRAF build needed twenty-one tickets built by agents, several at a time, without
the agents colliding. Three problems had to be solved together, and every existing answer
solved one of them well and the others badly.

**Isolation.** Agents editing one checkout switch branches out from under each other,
share a dev database, and race on `vendor/`, `node_modules/` and the build output. Git
worktrees fix the source tree, but a Laravel app is not only a source tree: it is also a
site, a database, and a build cache. A worktree with main's `.env` still points at main's
database and has no URL of its own.

**Orchestration.** Something has to decide which ticket is next, spawn the work, and know
when it is done. The obvious candidates were evaluated and rejected:

- **LangChain / LangGraph** — rebuilds the agent harness you are already typing into. The
  loop does not need a second runtime; it needs written routing.
- **worktrunk.dev** — a second worktree manager alongside Supacode. Its good ideas
  (create/merge hooks, copying build caches into a new tree) were absorbed into the scripts
  instead.
- **`codejunkie99/graph-engineering`** — a textbook, not a runtime. Four of its guardrails
  were adopted verbatim; nothing else applies.

**Verification.** An agent that writes both the code and the test that proves the code
tends to prove what it built rather than what was asked for. Implement-then-test does not
fix this — the same context writes both.

## Decision

Three artifacts, shipped as starter defaults.

**The issue tracker is the state machine.** A spec issue holds stages → slices → gates.
One issue per ticket, with `Blocked by` edges. There is no `PLAN.md`, no orchestrator
database, no state file — a second store of truth about progress would be a store that
drifts.

It is also the **mutex**. Two labels carry it: `ready-for-agent` marks a ticket written
well enough to hand over, and `in-progress` is a lock an agent takes — add the label,
comment the branch — before touching anything. A ticket is on the frontier when it is open,
`ready-for-agent`, not `in-progress`, and all its blockers are closed; invoked bare,
`/build-ticket` resolves that set itself. Parallel agents therefore need no coordinator to
avoid each other, which is what makes "spawn one agent per frontier ticket" safe.

Locks need releasing, so the agent drops the label on any run that ends without a merged PR,
and closing the ticket after a merge releases it naturally. GitHub gives no lease expiry —
a session that dies mid-ticket leaves a stale label, cleared by hand. That is the accepted
cost of not running a lock service for a build with tens of tickets.

Two markers in a ticket body drive the loop and are read at run time: `🛑 GATE` (a human
UX session before the PR) and `🗄️ CLONE` (provision against real data). The ANIDIGRAF
original hardcoded which ticket *numbers* were gates; numbers do not travel.

**One worktree is one ticket, provisioned whole.** `worktree-setup.sh` gives a worktree its
own Herd site, its own database, and APFS copy-on-write clones of the build caches. All
naming derives from the main checkout's directory name, so the scripts carry no project
identity. The starter's sqlite default makes this nearly free: the database is a file
inside the worktree, and the test database is phpunit's forced `:memory:`, so test-database
provisioning and the per-worktree `.env.testing` are skipped entirely. Postgres and MySQL
get the full treatment because they need it.

**Implementation and verification are separate contexts.** The implementer works TDD. Then
a subagent that has *not* seen the implementation reasoning reads the ticket and the spec
and attacks the built result for divergence. It reports; the implementer fixes. The
valuable separation is implementation versus verification, not writing versus testing.

Around that, four guardrails:

- Agents never merge a PR and never push to `main`. A human merges every one.
- One writer per file — only the implementer edits; verifier and reviewers are read-only,
  and findings route back through the implementer. Pushed down into the schema as
  per-slice table ownership.
- Every verify/fix cycle caps at 3 rounds, then stops and reports.
- The routing lives in the written skill. Agents fill the jobs; they never invent the plan.

Quality is the agent's job up to the gates: spec verification and an `impeccable` pass run
on every ticket without a human. Human UX review happens only at `🛑 GATE` tickets, where
judgment is actually needed.

## Consequences

- **A PR per ticket, always.** More PRs than a human-paced project would open, and the
  human merge is a real serialization point. That is the intended cost: it is the only
  place a person sees the whole diff before it lands.
- **Herd and `gh` become build dependencies.** The loop assumes local `.test` sites and
  GitHub Issues. Supacode stays optional — plain `git worktree` works everywhere the skill
  names it.
- **Teardown does not delete the worktree.** Removing the directory you are standing in
  kills the session, Supacode CLI included. Deleting the tree is a separate step from
  outside, which is easy to forget and cheap to fix.
- **`clone` mode can hand agents production-shaped data.** It exists because some slices
  prove nothing against demo data. Projects with sensitive dev databases should reach for
  `seed` and richer factories first.
- **A dead session leaves a ticket locked.** No lease, no expiry — the frontier silently
  loses a ticket until someone removes the label. The claim comment names the branch, which
  is what makes the manual check cheap.
- **Engine support is explicit, not generic.** sqlite, pgsql and mysql/mariadb have
  branches; anything else aborts with a message rather than half-provisioning. Adding an
  engine means editing both scripts.
- **"Push permutations down the stack" ships as a standing test rule** rather than living
  in one project's `.ai/rules`. Twenty feature tests for twenty inputs is the smell the
  loop would otherwise mass-produce, once per ticket, across a whole build.
