# The spec → tickets pattern

`build-ticket` runs one node of a graph. This is how the graph gets built. Do this once,
before any implementation, and the state machine takes care of itself afterwards.

The `to-spec` and `to-tickets` skills (mattpocock/skills) produce exactly this shape: `to-spec`
writes the spec issue, `to-tickets` fans it out into sub-issues with native dependencies and
the `ready-for-agent` label. Writing them by hand works too, as long as the result matches
what follows.

**There is no extra state file.** The issue tracker *is* the state machine: native
"blocked by" dependencies are the graph, labels are the frontier and the lock, and a
ticket on the frontier is one that is open, `ready-for-agent`, not `in-progress`, and has
every blocker closed. Nothing else tracks progress — no `PLAN.md`, no checklist file, no
orchestrator database. Commands for all of it: `docs/agents/issue-tracker.md`.

## 1 · One spec issue

A single GitHub issue holds the whole build plan (problem, solution, user stories,
implementation and testing decisions, out of scope). It is the document every ticket
links back to, and the only place the shape of the work is argued.

For a large build, structure it as **stages → slices → gates**:

- **Stage** — a coherent chunk of product (Foundation, Import, Member area). Stages are
  sequential; a stage's slices may run in parallel.
- **Slice** — one vertical cut inside a stage: schema + model + action + endpoint + UI for
  one concept. A slice is what one ticket builds. Don't defer UI to a final ticket.
- **Gate** — a human checkpoint between stages. Nothing in the next stage starts until the
  gate ticket is signed off.

Also record in the spec:

- **Delivery.** Either one PR per ticket (the default), or one integration branch for the
  whole spec (`feature/<name>`, a single PR at the end). Every ticket of an
  integration-branch spec says so in its Parent section — that line is what
  `build-ticket` reads.
- **Testing decisions:** the seams the tests sit at, agreed before any ticket starts.
- **Per-slice schema ownership.** Exactly one slice owns each table. Two tickets writing
  migrations for the same table is the failure mode this prevents — it is the "one writer
  per file" rule pushed down into the database.

## 2 · One issue per ticket

Each ticket is a GitHub issue, linked to the spec as a **sub-issue**, with:

- **Title** — `t<N>: <short imperative>` matching the branch it will get (`t33-user-import`).
- **Parent** — `#<spec>`, plus "ships on `<branch>`, the single PR for #<spec>" for an
  integration-branch spec.
- **Scope** — what this slice owns, including its tables.
- **Acceptance criteria** — the checklist the implementer tests against and the verifier
  attacks. Two criteria are mandatory on any ticket that introduces a model:
  - **Factories with named states.** Not just `UserFactory::new()` — the states the rest of
    the build needs (`->unverified()`, `->trashed()`, `->admin()`). Frontend and feature
    tests are only as good as the fixtures behind them, so these are acceptance criteria,
    verified *before* any frontend round, not an afterthought.
  - **Demo-seeder extension.** `DatabaseSeeder` grows with the slice, so the standing
    site and every fresh worktree show the new concept with plausible data.
- **Blocked by** — GitHub's native issue dependencies, the canonical edges: closing the
  blockers is what puts a ticket on the frontier. Mirror them as a `## Blocked by` list in
  the body for readers. Where native dependencies are unavailable, the body line *is* the
  edge, and `build-ticket` reads it.

## 3 · Two labels

The tracker holds the lock as well as the graph. Create both labels once, per repo.

| Label | Meaning |
| --- | --- |
| `ready-for-agent` | This ticket is written well enough for an agent to pick up unaided. Without it a ticket never enters the frontier, so it is also the "not yet, I'm still drafting this" switch. It is also one of the five triage roles (`docs/agents/triage-labels.md`). |
| `in-progress` | **Claimed.** An agent added it and commented which branch it took. No other agent touches the ticket while it is there. |

`in-progress` is a lock, so it must be released or the ticket falls out of the frontier for
good. The agent removes it whenever a run ends without the ticket landing; closing the
ticket releases it naturally. A stale label on a dead session is the failure mode to watch
for — the claim comment names the branch, so it is cheap to confirm and clear by hand.

## 4 · Markers the loop reads

Two markers in the acceptance criteria change how `build-ticket` runs. They are read from
the body — never hardcode ticket numbers into the skill.

| Marker | Effect |
| --- | --- |
| `🛑 GATE` | Stop before landing for a live UX session with the human on the ticket's Herd site. Iterate until sign-off, then land. |
| `🗄️ CLONE` | Provision the worktree with `scripts/worktree-setup.sh clone` — the real dev database instead of demo seed data. For slices that only mean anything against real content. |

Put them on their own line in the acceptance criteria so `gh issue view` shows them and a
`grep` finds them.

## 5 · Running the graph

- **Serial stretches** — the human starts one `build-ticket` session per ticket.
- **Wide parallel stretches** — a coordinator session spawns background worktree agents,
  one per frontier ticket. Each is fully isolated by `worktree-setup.sh`: own site, own
  database, own build caches, and each claims its ticket with `in-progress` before starting,
  so two agents never land on the same one. Parallel runs need worktrees; in place is for
  one ticket at a time.
- **PR mode** — agents open PRs and stop. The human merges. After each merge:
  teardown → delete worktree → `scripts/refresh-main.sh`.
- **Integration mode** — agents merge into the integration branch, push it and close
  their ticket; the human reviews the single PR when the spec is done.

## 6 · Worked example

The pattern's first full run, public and readable end to end:

- Spec issue: <https://github.com/SEAPTIdev/anidigraf-members/issues/29>
- Tickets: #30–#50 of the same repo.
