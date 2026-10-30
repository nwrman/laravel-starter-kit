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

Tickets are built with the `factory` plugin's `build-ticket` skill, typed `/factory:build-ticket N` in the main
checkout inside Herdr. By default it builds In a worktree: Herd serves it on its own subdomain with its own database
(set up and torn down by `herd.yml`), and a Herdr tab opens with the ticket's session; `in place` builds in the current
session instead. That session opens with a brief the human approves, settles the shape (design pass, browser walk, the
human's walk, code review, spec check) before writing the tests and running `composer preflight`, lands the ticket (a PR
for a human to merge, or commits on the spec's integration branch when the ticket names one), and runs
`factory-teardown` after the merge. `to-spec` and `to-tickets` produce the graph it reads; `docs/build-loop.md` is the
operator's manual.
