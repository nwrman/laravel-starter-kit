# 14. Build loop: two sessions per ticket, and the shape settles before the tests

Date: 2026-10-09

## Status

Accepted. Amends [ADR 0012](0012-multi-agent-build-loop.md); its tracker-as-state-machine,
worktree isolation and guardrails stand.

## Context

ADR 0012 shipped the loop as ANIDIGRAF first ran it: one session per ticket, test-driven
implementation, then verification, a design pass, the PR and a code review. ANIDIGRAF kept
running it for another thirty-odd commits, and minuta adopted it with mattpocock/skills v1.3.
Four things did not survive contact.

**One session cannot serve two directories.** MCP servers start once, with the session's
launch directory. `.mcp.json` runs `php artisan boost:mcp` by relative path, so a session
that created a worktree and moved into it kept getting main's answers — measured: main's
`APP_URL` from `get-absolute-url`, main's database from `database-query`, and rules recorded
with `record-rule` stranded in main twice. A session launched inside the worktree got the
worktree's.

**Test-first churned on shape, not behaviour.** On one ANIDIGRAF slice the same feature was
written test-first three times — as an Action, as a shared Inertia prop, as a controller —
and each test suite was deleted with the structure it described. None churned because a
behaviour was wrong. Every reviewer that ran after the tests turned each confirmed finding
into a code change plus a test rewrite plus a re-run.

**Green suites shipped broken software.** One ticket passed its suite, two reviewers and two
verification rounds with three defects that fell out the moment somebody clicked through.
And reports listed gates and verdicts without ever saying what the software now does — the
human had to ask "so, what has been built?" with the PR already open.

**One loop needed two delivery shapes.** minuta's specs sometimes ship as one integration
branch rather than a PR per ticket — the model upstream's `implement-spec` uses — and
sometimes a ticket is better built in the current checkout than in a worktree.

## Decision

**Two sessions per worktree ticket.** `/build-ticket` in main picks the ticket and names the
branch, then `scripts/start-ticket.sh` creates the worktree and opens a new session inside
it, which runs the loop. When the ticket has landed, that session tears down its own
resources and `scripts/handoff-to-main.sh` opens `/finish-ticket` in main, which deletes the
worktree (a session cannot delete the tree it stands in), prunes the branch, refreshes main
and closes the ticket. Supacode opens both sessions automatically; without it the scripts
print the command to paste, so Supacode stays recommended rather than required. Spawned
sessions launch with `--dangerously-skip-permissions` by default, because a prompt in a tab
nobody is watching is a stall rather than a safeguard; `BUILD_LOOP_CLAUDE` overrides it.

**Everything that can change the shape runs before anything that pins it.** The order is
brief → build → `impeccable` → browser walk → the human's acceptance (gate tickets) → code
review → spec verification → tests → `composer preflight` → land. Test-first remains for
behaviour the spec already pins down case by case. The brief is a gate: nothing is built
until the human says go, and it is where a criterion that would ship a defect gets
challenged. The loop closes with an account of what now exists, written against the brief.

**Two choices, read once in preflight.** The workspace is a worktree by default, or in place
on request. Delivery is a PR per ticket by default, or commits on the integration branch the
ticket's Parent section names.

**The environment learned from its failures.** Worktree sites are subdomains of the main
site, so saved browser credentials carry across tickets. Teardown force-drops every database
it owns, Pest's parallel test copies included — a missed drop once left 36 databases
standing. Worktrees copy main's TIA cache in, and `refresh-main.sh` re-pins main's baseline
on every merge so new worktrees do not re-run tests for work already merged. Supacode IDs are
derived from git, never from `SUPACODE_*`, which goes stale and once aimed a worktree at an
unrelated project.

## Consequences

- **More machinery.** Five scripts and two shared helpers where there were three scripts,
  and a second skill.
- **Untested code reaches the reviewers.** The code review and the verifier run before
  coverage exists. That is the trade: a review of the code, not of its coverage.
- **The human is asked earlier and more often** — the brief on every ticket, the acceptance
  on gate tickets before the reviewers — and is spared the rounds that would otherwise follow
  a late correction.
- **Spawned sessions run without permission prompts by default.** Anyone who wants the
  prompts sets `BUILD_LOOP_CLAUDE=claude`.
- **Branches merge with merge commits only**, and the repo should be configured to enforce
  it (`docs/build-loop.md`, Prerequisites). A ticket lands as several commits on purpose.
