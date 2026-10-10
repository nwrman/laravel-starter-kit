## Agent skills

Configuration for the mattpocock/skills engineering skills (`to-spec`, `to-tickets`, `triage`, `wayfinder`,
`implement-spec`, `code-review`, `domain-modeling`, …). It is the output of `/setup-matt-pocock-skills`, kept here
rather than in `CLAUDE.md` because Boost regenerates that file from this directory.

### Issue tracker

GitHub Issues of this repo's `origin` remote, through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels, unrenamed: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
`in-progress` is the build loop's lock, not a triage role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the repo root, decisions in `docs/adr/`. See `docs/agents/domain.md`.

### Build loop

Tickets are built one at a time with the `build-ticket` skill (`.ai/skills/build-ticket/`). Invoked in the main
checkout, it names the branch and runs `scripts/start-ticket.sh`, which opens the ticket's own session in a fresh
worktree (or, on request, builds in place). That session opens with a brief the human approves, settles the shape
(design pass, browser walk, gate acceptance, code review, spec check) before writing the tests and running
`composer preflight`, then lands the ticket: a PR for a human to merge, or commits on the spec's integration branch
when the ticket names one. `finish-ticket` cleans up from main afterwards. `to-spec` and `to-tickets` produce the
graph it reads; `docs/build-loop.md` is the operator's manual.
