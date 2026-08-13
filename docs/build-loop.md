# The multi-agent build loop

Machinery for building a project in slices, with one agent per ticket, each in its own
fully isolated environment. Ported from the ANIDIGRAF build and generalized so any
descendant of this starter inherits it.

The short version: **the issue tracker is the state machine, one worktree is one ticket,
and every ticket ends in a PR that a human merges.** Nothing else tracks progress — the
graph, the frontier and the lock all live in GitHub Issues.

| Piece | What it is |
|---|---|
| [`.ai/skills/build-ticket/SKILL.md`](../.ai/skills/build-ticket/SKILL.md) | The per-ticket loop. `/build-ticket 33`. |
| [`.ai/skills/build-ticket/reference/spec-and-tickets.md`](../.ai/skills/build-ticket/reference/spec-and-tickets.md) | How to write the spec issue and the tickets it fans out into. |
| [`scripts/worktree-setup.sh`](../scripts/worktree-setup.sh) | Provisions a worktree: own Herd site, own database, cloned build caches. |
| [`scripts/worktree-teardown.sh`](../scripts/worktree-teardown.sh) | Removes the site and databases after the PR merges. |
| [`scripts/refresh-main.sh`](../scripts/refresh-main.sh) | Brings the main checkout back to the standing latest after each merge. |

Why it exists and what was rejected: [ADR 0012](adr/0012-multi-agent-build-loop.md).

## Prerequisites

- **Laravel Herd** — each worktree gets its own `.test` site.
- **`gh`** — tickets and PRs live in GitHub Issues.
- **Supacode** *(optional)* — worktree/tab management. Plain `git worktree` works everywhere
  the skill mentions Supacode.
- A **database server** if the project is on Postgres or MySQL. Sqlite projects need nothing.

## Start of a build: write the graph once

Read [`reference/spec-and-tickets.md`](../.ai/skills/build-ticket/reference/spec-and-tickets.md)
and produce:

1. **One spec issue** — stages → slices → gates, plus per-slice schema ownership.
2. **One issue per ticket** — titled `t<N>: <imperative>`, carrying `Blocked by #<M>` lines
   and acceptance criteria.
3. **Two labels**, created once per repo: `ready-for-agent` and `in-progress`.

Two markers in a ticket body change how the loop runs. They are read from the body at run
time — never hardcoded into the skill:

| Marker | Effect |
|---|---|
| `🛑 GATE` | Stop before the PR for a live UX session on the worktree's site. |
| `🗄️ CLONE` | Provision the worktree against the real dev database, not demo seed data. |

## The frontier and the lock

A ticket is **on the frontier** when it is open, labelled `ready-for-agent`, *not* labelled
`in-progress`, and every one of its `Blocked by` issues is closed.

`ready-for-agent` is yours: it says the ticket is written well enough to hand over. Leave it
off while you are still drafting and no agent will touch it.

`in-progress` is the agent's, and it is a **lock**. Before doing anything, the agent adds it
and comments which branch it took; while it is there, no other agent picks the ticket up.
The agent removes it if the run ends without a merged PR, and closing the ticket after a
merge releases it naturally.

```bash
gh label create ready-for-agent && gh label create in-progress   # once per repo
gh issue list --label ready-for-agent --state open               # see the candidates
```

## Running one ticket

```
/build-ticket 33      # this ticket
/build-ticket         # whatever is next on the frontier
```

Bare, it resolves the frontier itself: one candidate → it takes it and says so; several →
it lists them and asks which; none → it reports what is blocking and stops.

The skill runs seven steps and then stops:

1. **Preflight** — resolve the ticket, confirm every blocker is closed, **claim it with
   `in-progress`**, read the spec and the matching rule files.
2. **Worktree** — branch `t33-<slug>`, then `scripts/worktree-setup.sh`.
3. **TDD implementation** — red-green-refactor against the acceptance criteria.
4. **Spec-conformance verification** — a *fresh-context* subagent that never saw the
   implementation reasoning attacks the result for divergence from the spec.
5. **Impeccable self-review** — UI tickets only, against the running site.
6. **Pull request** — after the human gate session, if the ticket has one.
7. **Adversarial code review** — the `code-review` skill, findings routed to the implementer.

Then it reports and **waits**. Three guardrails hold throughout:

- Agents never merge a PR and never push to `main`.
- One writer per file — only the implementer edits; verifier and reviewers are read-only.
- Every verify/fix cycle caps at **3 rounds**, then stops and reports.

## Provisioning a worktree

```bash
# from inside the worktree
scripts/worktree-setup.sh          # seed mode (default)
scripts/worktree-setup.sh clone    # copy main's dev database instead
```

Idempotent — safe to re-run. It:

1. Clones `vendor/` and `node_modules/` from the main checkout with APFS copy-on-write
   (`cp -Rc`, near-instant and near-free on disk), then trues up with `composer install`
   and `bun install`.
2. Copies main's `.env` and overrides `APP_URL` and the database.
3. Creates the app database (and a test database, on server engines).
4. Writes a per-worktree `.env.testing` — **non-sqlite projects only**.
5. Links the Herd site and runs a first `bun run build`.

### Naming

Everything derives from the **main checkout's directory name**, so nothing is
project-specific. For a repo in `laravel-starter-kit/` on branch `t33-user-import`:

| | |
|---|---|
| Site | `http://laravel-starter-kit-t-33.test` |
| App database | `laravel_starter_kit_t33` |
| Test database | `laravel_starter_kit_t33_test` |

Branches not matching `t<N>-…` fall back to a slugified branch name.

### Modes

- **`seed`** (default) — migrate from zero, then `DatabaseSeeder`. The normal case.
- **`clone`** — copy the main checkout's dev database, then run this branch's migrations on
  top. For slices that only mean anything against real content, where demo data would prove
  nothing. Destructive: it drops and recreates the worktree's app database.

### Database engines

| `DB_CONNECTION` | App DB | Test DB | `.env.testing` |
|---|---|---|---|
| `sqlite` (starter default) | worktree-local `database/database.sqlite` | none — phpunit force-pins `:memory:` | not written |
| `pgsql` | `createdb`, `pg_dump` for clone | `<db>_test` | written |
| `mysql` / `mariadb` | `CREATE DATABASE`, `mysqldump` for clone | `<db>_test` | written |

The sqlite row is why a fresh starter project needs no database server: the file lives
inside the worktree, so isolation is free, and the test database is already `:memory:`.
The `.env.testing` step exists only for the other engines — without it, `composer test:*`
runs against the dev database (see the test-isolation section of
`.ai/guidelines/enforce-tests.blade.php`).

Anything else aborts with a message telling you to add a branch to both scripts.

## After the merge

Run in this order, and mind where you stand:

```bash
scripts/worktree-teardown.sh      # INSIDE the worktree — unlinks the site, drops its DBs
```

```bash
supacode worktree delete          # OUTSIDE it — or: git worktree remove <path>
scripts/refresh-main.sh           # on the main checkout
```

Teardown deliberately does **not** delete the worktree. Removing the directory you are
standing in kills the session — Supacode CLI included. That is a separate step, from
outside.

`refresh-main.sh` pulls, installs, migrates and builds, so the main checkout's site stays
the standing latest for everyone looking at the project.

## Running several tickets at once

Isolation is what makes this safe: separate site, separate database, separate build caches
per worktree. Two shapes:

- **Serial stretches** — a human starts one `/build-ticket` session at a time.
- **Wide parallel stretches** — a coordinator session spawns one background worktree agent
  per frontier ticket (every blocker closed).

Both end the same way: PRs stack up, a human merges them.

> **One agent per working tree.** Two agents sharing one checkout will switch branches out
> from under each other. That collision is the whole reason the worktree scripts exist —
> use them rather than juggling branches in a single tree.

## If something jams

- **A verify/fix cycle stalls.** It caps at 3 rounds — the agent stops and reports rather
  than thrashing. Read the findings and decide.
- **A ticket is stuck on `in-progress` with no one working it.** A session died before
  releasing its claim. The claim comment names the branch, so check whether that branch has
  anything on it, then `gh issue edit <N> --remove-label in-progress` to put it back on the
  frontier.
- **A worktree is left over from a dead session.** Run `scripts/worktree-teardown.sh` inside
  it, then `git worktree remove <path>` from outside (or `supacode worktree delete`).
