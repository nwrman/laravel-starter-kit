# The multi-agent build loop

Machinery for building a project in slices, with one agent session per ticket, each in its
own fully isolated environment. Ported from the ANIDIGRAF build, refined across its
descendants, and generalized so any app cloned from this starter inherits it.

The short version: **the issue tracker is the state machine, one ticket is built at a time
in its own workspace and its own session, and nothing reaches `main` without a human
merging a PR.** Nothing else tracks progress — the graph, the frontier and the lock all live
in GitHub Issues.

The loop ships as a Claude Code plugin, `factory`, from nwrman's software factory
(its `plugins/factory` folder), switched on in each project's `.claude` settings. A
project keeps only its `herd.yml`, `composer preflight` and its Boost skills; this starter ships the
`herd.yml`, so every app made from it can build in a worktree from its first day.

| Piece | What it is |
|---|---|
| The plugin's `build-ticket` skill | The per-ticket loop. `/factory:build-ticket 33`. Its `reference/spec-and-tickets.md` says how to write the spec issue and the tickets it fans out into. |
| The plugin's agents | The Specialists the loop starts at its steps: UI Designer, Browser Walker, Code Reviewer, Spec Verifier, Test Reviewer. |
| `factory-start-ticket` | Creates a ticket's worktree through Herd and opens its session in a Herdr tab. |
| `factory-teardown` | Run by the ticket's session after the merge: deletes the worktree, site and databases, prunes the branch, refreshes main, closes the tab. |
| [`herd.yml`](../herd.yml) | How this project's worktrees are set up and torn down. |
| [`scripts/refresh-main.sh`](../scripts/refresh-main.sh) | Brings the main checkout back to the standing latest. |

Why it exists and what was rejected: [ADR 0012](adr/0012-multi-agent-build-loop.md); why the loop
pins tests last: [ADR 0014](adr/0014-build-loop-two-sessions-shape-before-tests.md).
How the mattpocock/skills engineering skills are wired to this repo (tracker, labels,
glossary): [`docs/agents/`](agents/).

## Prerequisites

- **Laravel Herd** — each worktree gets its own `.test` site and database.
- **Herdr** — the terminal every session runs in; a ticket's worktree session opens in its
  own tab, and the factory reads live session state from it.
- **`gh`** — tickets and PRs live in GitHub Issues.
- **Postgres** (DBngin, on its defaults) — every checkout and worktree has its own database
  and its own `_test` database (ADR 0016).

Once per repo:

```bash
gh label create ready-for-agent && gh label create in-progress
gh api -X PATCH repos/{owner}/{repo} -F allow_squash_merge=false -F allow_rebase_merge=false -F delete_branch_on_merge=true
```

Then switch the plugin on in the repo's `.claude/settings.json` (or, for a public repo like this
starter, the gitignored `.claude/settings.local.json`), and accept Claude Code's workspace trust for
the repo once — an untrusted repo loads no project plugin:

```json
{
  "extraKnownMarketplaces": {
    "software-factory": { "source": { "source": "directory", "path": "/path/to/software-factory" } }
  },
  "enabledPlugins": { "factory@software-factory": true }
}
```

The plugin is read in place from the factory's checkout: an edit there reaches every project's
next session (or `/reload-plugins`).

## Start of a build: write the graph once

Read the plugin's `reference/spec-and-tickets.md`
and produce — by hand, or with the `to-spec` and `to-tickets` skills, which write this shape:

1. **One spec issue** — stages → slices → gates, its delivery mode (a PR per ticket, or one
   integration branch), its testing decisions, and per-slice schema ownership.
2. **One issue per ticket** — a sub-issue of the spec, titled `t<N>: <imperative>`, with
   GitHub's native "blocked by" dependencies and acceptance criteria.

Two markers in a ticket body change how the loop runs. They are read from the body at run
time — never hardcoded into the skill:

| Marker | Effect |
|---|---|
| `🛑 GATE` | The human reviews and accepts the built surface before the reviewers and the tests run. |
| `🗄️ CLONE` | Build the worktree against a copy of the main checkout's database, not demo seed data — as if you had typed `clone-db`. |

## The frontier and the lock

A ticket is **on the frontier** when it is open, labelled `ready-for-agent`, *not* labelled
`in-progress`, and every one of its blockers is closed. Blockers are GitHub's native issue
dependencies (`issue_dependencies_summary.blocked_by` counts the open ones); a hand-written
`Blocked by #<M>` line in the body counts too.

`ready-for-agent` is yours: it says the ticket is written well enough to hand over. Leave it
off while you are still drafting and no agent will touch it.

`in-progress` is the agent's, and it is a **lock**. Before doing anything, the agent adds it
and comments which branch it took; while it is there, no other agent picks the ticket up.
The agent removes it if the run ends without the ticket landing, and closing the ticket
releases it naturally.

## Running one ticket

In a Claude Code session on the main checkout, inside Herdr:

```
/factory:build-ticket 33             # in a worktree, with a fresh, seeded database
/factory:build-ticket 33 clone-db    # in a worktree, with a copy of main's database
/factory:build-ticket 33 in place    # in this session, on a new branch
/factory:build-ticket                # whatever is next on the frontier
```

Nothing else is asked. Bare, it resolves the frontier itself: one candidate → it takes it and
says so; several → it lists them and asks which; none → it reports what is blocking and stops.
The ticket's branch is cut from **the branch the main checkout is on**, from its local state;
starting from another ticket's branch is refused. A project with no `herd.yml` builds in place.

### Two sessions, on purpose

The session in main only picks the ticket, reads its delivery mode and names the branch. It
then runs `factory-start-ticket`, which creates the worktree and opens a **new session inside
it**, in a Herdr tab beside yours that does not take focus. That session does the build, and
its Brief is the first thing you see there. The reason is the MCP servers: they start with the
session's directory and never move, so a session that started in main keeps getting answers
about main — its URL, its database, its logs — even after it changes directory. And the context
the Brief loads stays in the session that builds the ticket.

In place, the same session cuts the branch and carries on: against the main site, its database
and whatever dev server is already running. One ticket at a time.

### The order, and why

```
brief → build → look at it → impeccable → walk it → you accept (gate tickets) → code review
      → verify → TESTS → test review → preflight → land → merge → what now exists
```

Everything that can still change the shape of the work runs before anything that pins it.
Tests written first describe a shape that is still moving, and rewriting them is pure waste:
on the ANIDIGRAF build, three test suites were written test-first and deleted with the
structures they described, none because a behaviour was wrong. So the agent builds, you can
watch it on the dev server, the design pass and the browser walk run, you accept it (gate
tickets), the reviewers attack it — and only then are the tests written and the
`composer preflight` gate run. Test-first is still used where the behaviour is fully pinned
down and fiddly.

Step by step, in the ticket's session:

0. **Claim** — add `in-progress`, read the spec, the rules, the glossary and the ADRs.
1. **Brief** — how the ticket will be built (where, which branch from which base, which site
   and database), then what will exist when it is done, in plain words. **It waits for your
   go.** If a criterion as written would ship a defect, it says so here.
2. **Confirm the ground** — the branch, `.env` and the site are the worktree's own.
3. **Build** — shape first, no tests yet, `bun run dev` running so you can watch.
4. **The UI Designer** runs `impeccable` on any user-facing surface, before you see it.
5. **The Browser Walker walks it** — every state, a keyboard-only pass, side effects checked in
   the database, and what the deployed configuration does differently.
6. **Gate tickets: you accept**, before anything is pinned.
7. **Code review** on the branch, by the Code Reviewer, once per axis.
8. **Spec check** by the Spec Verifier, in a fresh context, including that every deferred piece is owned by
   an open ticket.
9. **`impeccable` second look** at what changed since step 4.
10. **Tests**, including at least one browser spec that earns its place.
    **10b. Test review** by the Test Reviewer, in a fresh context, against the `test-quality` checklist: what
    wrong code would each new test catch?
11. **`composer preflight`** — blocks until green; its table goes in the landing note.
12. **Land** — a PR, or commits on the integration branch (below).
13. **Report** what was built, against the brief — then, after the merge, tear down.

Three guardrails hold throughout:

- Agents merge a PR only when nwrman tells them to, for that PR, and never push to `main`
  (integration branches are fine).
- One writer per file — only the implementer edits; verifier and reviewers are read-only,
  and isolated from each other.
- Every verify/fix cycle caps at **3 rounds**, then stops and reports.

### Delivery: a PR per ticket, or one integration branch

Read from the ticket, never asked:

| Mode | When | Lands as |
|---|---|---|
| PR (default) | The ticket names no integration branch | Its own PR off `main`; the agent stops and you merge it. |
| Integration | The ticket's Parent section says "ships on `feature/x`" | Commits merged into that branch, which is pushed; the ticket is closed. The spec ships as one PR at the end. |

Integration mode is the same model as the `implement-spec` skill, so this one loop covers
both.

## Your touchpoints

1. **The brief — every ticket.** Read what it says will exist and say go (or correct it).
2. **Gate tickets** — a live session on the ticket's site, after the design pass and the
   walk and before the reviewers and the tests. Iterate there until you sign off.
3. **The merge — every PR.** The body opens with what now exists, then the acceptance
   checklist, the green preflight table, the verdicts and the browser-spec claim. Merge with
   a merge commit, never a squash, and tell the agent "merged".

## Provisioning a worktree

`factory-start-ticket`, run by the session in main, in order:

1. `git worktree add -b <branch> ~/.worktrees/<repo>/<branch, / as -> <base>` — out of
   `~/projects` and out of the repo. It records the base in `branch.<branch>.tiaBase`.
2. `herd workspace --database=empty|clone`, **inside** the worktree, so Herd adopts it: it
   serves it at `https://<branch, / as ->.<project>.test` (a subdomain of the main site, so a
   login saved once is offered on every ticket, while each session cookie stays on its own
   host), copies `.env`, `vendor`, `node_modules` and the built assets from main, rewrites
   `APP_URL`, and gives it its own database: empty and migrated, or a copy of main's.
3. The Product's `herd.yml` `after_create` does the rest — refuse a worktree Herd left on
   main's database, the `_test` database and its `.env.testing`, seed a fresh database, the TIA baseline the last landed ticket published for the base
   — and leaves a marker. **Herd runs a failing hook line and carries on without a word**, so
   the marker is the only proof setup finished: without it the ticket does not start, and the
   failing command is printed.
4. A Herdr tab `t<N>` opens beside yours, in the background, with Claude on the ticket.

A worktree that already exists for the branch is reattached: only the tab opens again.

### A Product's `herd.yml`

The starter's is [`herd.yml`](../herd.yml); read it rather than a copy here. Each hook is **one
line**, a strict bash script with its trace in a log, because of how Herd treats a failing line.

- `after_create` fails first if Herd did not give the worktree its own database. When Herd
  cannot create one it quietly shares main's, and a worktree seeding or testing against main's
  database destroys work. It then writes `.env.testing` for `<worktree db>_test`, creates it
  with `migrate --env=testing`, seeds a fresh database, inherits the TIA baseline and leaves
  the marker.
- `before_delete` publishes the TIA baseline and drops the `_test` database and its
  `--parallel` copies. Herd drops the app database itself.

The hooks see `HERD_WORKSPACE_DATABASE`, `HERD_WORKSPACE_DATABASE_MODE`, `HERD_WORKSPACE_BRANCH`,
`HERD_WORKSPACE_PATH` and `HERD_WORKSPACE_PARENT_PATH`. [`.ai/rules/database.md`](../.ai/rules/database.md)
has the whole database arrangement.

## After the ticket lands

Nothing for you to type. Once you merge, the ticket's session closes its ticket with the account
from the landing note, releases the lock, and runs `factory-teardown`. It refuses while the
branch has commits that are not on its base upstream. Otherwise, in a worktree: `herd
workspace:delete` from the main checkout (the `before_delete` hook publishes the TIA baseline and
drops the test databases; Herd removes the worktree, site, certificate and database), the branch
is deleted locally and on GitHub if it survived, the main checkout runs its
`scripts/refresh-main.sh`, and the Herdr tab closes last — which ends the session, as expected.
In place it publishes the TIA baseline, switches back to the base and refreshes.

`refresh-main.sh` pulls, installs, migrates and builds, so the main checkout's site stays
the standing latest. It runs no tests: the TIA baseline the next ticket needs was already
published by this ticket's teardown ([ADR 0015](adr/0015-tia-baselines-flow-from-landed-tickets.md)). It migrates but never
re-seeds: if a ticket ships new seed data, its landing note names the command that writes it.

## Running several tickets at once

Isolation is what makes this safe: separate site, separate database, separate build caches
per worktree. Two shapes:

- **Serial stretches** — you start one `/factory:build-ticket` at a time.
- **Wide parallel stretches** — tell one session in main to coordinate: run
  `factory-start-ticket` for each frontier ticket and report as PRs open.

Both end the same way: PRs stack up and you merge them — or, on an integration-branch spec,
one PR arrives when the last ticket closes.

> **One agent per working tree.** Two agents sharing one checkout will switch branches out
> from under each other. That collision is the whole reason worktrees exist — use them
> rather than juggling branches in a single tree.

## If something jams

- **A verify/fix cycle stalls.** It caps at 3 rounds — the agent stops and reports rather
  than thrashing, and asks whether to keep the worktree for inspection or tear it down.
- **A ticket is stuck on `in-progress` with no one working it.** A session died before
  releasing its claim. The claim comment names the branch, so check whether that branch has
  anything on it, then `gh issue edit <N> --remove-label in-progress` to put it back on the
  frontier.
- **A worktree is left over from a dead session.** Open a tab in it and run
  `factory-teardown` — it refuses while the branch has unlanded commits. Or by hand, from the
  main checkout: `herd workspace:delete <branch, / as -> --force`, then `git branch -D <branch>`.
- **A ticket won't start: its setup did not finish.** `factory-start-ticket` printed the failing
  command from `herd.yml`. Fix it, delete the workspace from the main checkout, and start
  again.
