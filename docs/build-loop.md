# The multi-agent build loop

Machinery for building a project in slices, with one agent session per ticket, each in its
own fully isolated environment. Ported from the ANIDIGRAF build, refined across its
descendants, and generalized so any app cloned from this starter inherits it.

The short version: **the issue tracker is the state machine, one ticket is built at a time
in its own workspace and its own session, and nothing reaches `main` without a human
merging a PR.** Nothing else tracks progress — the graph, the frontier and the lock all live
in GitHub Issues.

| Piece | What it is |
|---|---|
| [`.ai/skills/build-ticket/SKILL.md`](../.ai/skills/build-ticket/SKILL.md) | The per-ticket loop. `/build-ticket 33`. |
| [`.ai/skills/finish-ticket/SKILL.md`](../.ai/skills/finish-ticket/SKILL.md) | The cleanup after a ticket lands, run in the main checkout. Spawned for you. |
| [`.ai/skills/build-ticket/reference/spec-and-tickets.md`](../.ai/skills/build-ticket/reference/spec-and-tickets.md) | How to write the spec issue and the tickets it fans out into. |
| [`scripts/start-ticket.sh`](../scripts/start-ticket.sh) | Creates a ticket's worktree and opens its session there. |
| [`scripts/worktree-setup.sh`](../scripts/worktree-setup.sh) | Provisions a worktree: own Herd site, own database, cloned build caches, warm TIA cache. |
| [`scripts/worktree-teardown.sh`](../scripts/worktree-teardown.sh) | Removes the site, databases and TIA cache after the ticket lands. |
| [`scripts/handoff-to-main.sh`](../scripts/handoff-to-main.sh) | Hands the end of a ticket to `/finish-ticket` in the main checkout. |
| [`scripts/refresh-main.sh`](../scripts/refresh-main.sh) | Brings the main checkout back to the standing latest and re-pins its TIA baseline. |
| [`scripts/worktree-names.sh`](../scripts/worktree-names.sh), [`supacode-ids.sh`](../scripts/supacode-ids.sh), [`tia-helper.php`](../scripts/tia-helper.php) | Shared helpers the scripts source. |

Why it exists and what was rejected: [ADR 0012](adr/0012-multi-agent-build-loop.md); why
the loop now runs in two sessions and pins tests last: [ADR 0014](adr/0014-build-loop-two-sessions-shape-before-tests.md).
How the mattpocock/skills engineering skills are wired to this repo (tracker, labels,
glossary): [`docs/agents/`](agents/).

## Prerequisites

- **Laravel Herd** — each worktree gets its own `.test` site.
- **`gh`** — tickets and PRs live in GitHub Issues.
- **Supacode** *(recommended)* — the scripts open each ticket's session in its own tab, and
  the cleanup session in main, without you doing anything. Without it they create the
  worktree with plain git and print the one command to paste into a new terminal.
- A **database server** if the project is on Postgres or MySQL. Sqlite projects need nothing.

Once per repo:

```bash
gh label create ready-for-agent && gh label create in-progress
gh api -X PATCH repos/{owner}/{repo} -F allow_squash_merge=false -F allow_rebase_merge=false -F delete_branch_on_merge=true
```

## Start of a build: write the graph once

Read [`reference/spec-and-tickets.md`](../.ai/skills/build-ticket/reference/spec-and-tickets.md)
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
| `🗄️ CLONE` | Provision the worktree against a copy of the real dev database and uploads, not demo seed data. |

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

In a Claude Code session on the main checkout:

```
/build-ticket 33      # this ticket
/build-ticket         # whatever is next on the frontier
```

Bare, it resolves the frontier itself: one candidate → it takes it and says so; several →
it lists them and asks which; none → it reports what is blocking and stops.

### Two sessions, on purpose

The session in main only picks the ticket, reads its delivery mode and names the branch. It
then runs `scripts/start-ticket.sh`, which creates the worktree and opens a **new session
inside it**. That session does the build. The reason is the MCP servers: they start with the
session's directory and never move, so a session that started in main keeps getting answers
about main — its URL, its database, its logs — even after it changes directory.

Say **"no worktree"** (or "in this session") and the ticket is built in place instead: a
branch in the current checkout, against the main site and whatever dev server is already
running, in this same session. No provisioning, no teardown, and one ticket at a time.

### The order, and why

```
brief → build → look at it → impeccable → walk it → you accept (gate tickets) → code review
      → verify → TESTS → preflight → land → merge → what now exists
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
1. **Brief** — what will exist when the ticket is done, in plain words. **It waits for your
   go.** If a criterion as written would ship a defect, it says so here.
2. **Confirm the ground** — the branch, `.env` and the site are the worktree's own.
3. **Build** — shape first, no tests yet, `bun run dev` running so you can watch.
4. **`impeccable`** on any user-facing surface, before you see it.
5. **Walk it in a browser** — every state, a keyboard-only pass, side effects checked in
   the database, and what the deployed configuration does differently.
6. **Gate tickets: you accept**, before anything is pinned.
7. **Code review** on the branch.
8. **Spec check** by a fresh-context agent, including that every deferred piece is owned by
   an open ticket.
9. **`impeccable` second look** at what changed since step 4.
10. **Tests**, including at least one browser spec that earns its place.
11. **`composer preflight`** — blocks until green; its table goes in the landing note.
12. **Land** — a PR, or commits on the integration branch (below).
13. **Report** what was built, against the brief — then hand off to main.

Three guardrails hold throughout:

- Agents never merge a PR and never push to `main` (integration branches are fine).
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

`start-ticket.sh` runs this as the new session's first command; by hand, from inside the
worktree:

```bash
scripts/worktree-setup.sh          # seed mode (default)
scripts/worktree-setup.sh clone    # copy main's dev database and uploads instead
```

Idempotent — safe to re-run. It:

1. Clones `vendor/` and `node_modules/` from the main checkout with APFS copy-on-write
   (`cp -Rc`, near-instant and near-free on disk), then trues up with `composer install`
   and `bun install`.
2. Copies main's `.env` and points `APP_URL` and the database at the worktree — on every
   run, because a new Supacode worktree arrives with main's ignored files already in it.
3. Creates the app database (and a test database, on server engines).
4. Writes a per-worktree `.env.testing` — **non-sqlite projects only**.
5. Links the Herd site and runs a first `bun run build`.
6. Copies main's TIA cache in, so the first `composer preflight` replays instead of
   running the whole suite.

### Naming

Everything derives from the **main checkout's directory name** and the branch
(`scripts/worktree-names.sh`), so nothing is project-specific. For a repo in
`laravel-starter-kit/` on branch `feature/t33-user-import`:

| | |
|---|---|
| Site | `http://t33.laravel-starter-kit.test` |
| App database | `laravel_starter_kit_t33` |
| Test database | `laravel_starter_kit_t33_test` |

The site is a **subdomain** of the main site on purpose: browsers then treat every worktree
as the same site for saved passwords, so a login saved once is offered on every ticket.
Sessions stay separate, because the session cookie is pinned to the exact host. The type
prefix never reaches the names; branches without a `t<N>` fall back to a slug of the whole
branch name.

### Modes

- **`seed`** (default) — migrate, then `DatabaseSeeder`, only when the database is new. A
  re-run just migrates.
- **`clone`** — copy the main checkout's dev database and `storage/app` uploads, then run
  this branch's migrations on top. For slices that only mean anything against real content.
  Destructive: it drops and recreates the worktree's app database.

### Database engines

| `DB_CONNECTION` | App DB | Test DB | `.env.testing` |
|---|---|---|---|
| `sqlite` (starter default) | worktree-local `database/database.sqlite` | none — phpunit force-pins `:memory:` | not written |
| `pgsql` | `createdb`, `pg_dump` for clone | `<db>_test` | written |
| `mysql` / `mariadb` | `CREATE DATABASE`, `mysqldump` for clone | `<db>_test` | written |

The sqlite row is why a fresh starter project needs no database server: the file lives
inside the worktree, so isolation is free, and the test database is already `:memory:`.
The `.env.testing` step exists only for the other engines — without it, `composer test:*`
runs against the dev database (see the test-isolation section of the toolkit's
"Running Tests" guideline, `vendor/nwrman/laravel-toolkit/resources/boost/guidelines/core.blade.php`).

Anything else aborts with a message telling you to add a branch to both scripts.

## After the ticket lands

Nothing for you to type. The ticket's session runs, inside its worktree:

```bash
scripts/worktree-teardown.sh      # site, every database it owns (parallel test copies too), TIA cache
scripts/handoff-to-main.sh <N>    # opens /finish-ticket in the main checkout
```

`/finish-ticket` then, from main: proves the work landed (it refuses to delete unmerged
commits), deletes the worktree — which ends the ticket's session, as expected — prunes the
remote branch, runs `scripts/refresh-main.sh`, and closes the ticket with the account from
the landing note. It finishes by naming the tickets that just became unblocked.

`refresh-main.sh` pulls, installs, migrates and builds, so the main checkout's site stays
the standing latest — and it re-pins main's TIA baseline to HEAD, so the next worktree diffs
against main rather than re-running tests for work already merged. It migrates but never
re-seeds: if a ticket ships new seed data, its handoff names the command that writes it.

## Running several tickets at once

Isolation is what makes this safe: separate site, separate database, separate build caches
per worktree. Two shapes:

- **Serial stretches** — you start one `/build-ticket` at a time.
- **Wide parallel stretches** — tell one session in main to coordinate: run
  `start-ticket.sh` for each frontier ticket and report as PRs open.

Both end the same way: PRs stack up and you merge them — or, on an integration-branch spec,
one PR arrives when the last ticket closes.

> **One agent per working tree.** Two agents sharing one checkout will switch branches out
> from under each other. That collision is the whole reason the worktree scripts exist —
> use them rather than juggling branches in a single tree.

## If something jams

- **A verify/fix cycle stalls.** It caps at 3 rounds — the agent stops and reports rather
  than thrashing, and asks whether to keep the worktree for inspection or tear it down.
- **A ticket is stuck on `in-progress` with no one working it.** A session died before
  releasing its claim. The claim comment names the branch, so check whether that branch has
  anything on it, then `gh issue edit <N> --remove-label in-progress` to put it back on the
  frontier.
- **A worktree is left over from a dead session.** Run `scripts/worktree-teardown.sh` inside
  it, then `/finish-ticket <N>` from main — it checks for unmerged commits before deleting.
- **Teardown says it could not drop a database.** Something still holds it open; everything
  else is torn down. Re-run the script once it is idle.
