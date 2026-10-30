# 15. TIA baselines flow from landed tickets, and the coverage gate stays unfiltered

Date: 2026-10-19

## Status

Accepted. Amends [ADR 0014](0014-build-loop-two-sessions-shape-before-tests.md): the
"refreshes main" step no longer re-pins a TIA baseline.

## Context

Test Impact Analysis only pays off when a ticket's worktree starts with a complete baseline:
a graph, a coverage cache, and recorded results at a commit in the branch's history. Then the
first `composer test` replays only what the ticket changes, and `composer preflight` replays
instead of re-recording. In practice, no worktree ever had one.

**Main's baseline went stale, or empty.** `refresh-main.sh` re-pinned it with an extra full
run, but only while the main checkout sat on `main`. Minuta's sat on an integration branch, so
its `main` baseline froze as a results-only snapshot with no commit (sha `null`). Pest falls
back to the `main` baseline for any branch without its own, so every new worktree inherited
the empty one. The starter's own main checkout held no `main` baseline at all.

**No coverage cache ever existed.** The re-pin used `test:fast`, which writes none, so the
warm copy into a worktree was always skipped and the first preflight re-recorded everything.

**The cache only works when tickets cut from any base.** A ticket branches from `main` or from
an integration branch, and its PR targets that same branch. Pest only falls back to `main` on
its own, and it prunes baselines for branches that no longer exist.

**Excluding Browser specs from coverage switched TIA off.** Minuta's coverage gate added
`--exclude-testsuite=Browser` to speed preflight up. Pest treats every selection flag
(`--exclude-testsuite`, `--group`, `--filter`, …) as a partial run and disables TIA. So every
preflight ran the whole suite, about 100 seconds, and never left a baseline behind.

Recording a fresh baseline in every new worktree would fix the staleness, but it costs a full
coverage run before each ticket can start. That's the redundant work TIA exists to remove.

## Decision

**Landed tickets supply the baseline.** Every ticket already ends with a green
`composer preflight`, which is a complete coverage run at its final commit. When
`finish-ticket` closes a ticket whose final commit is merged into its base, it publishes that
cache as the base branch's baseline. The cache lives in a per-repo store outside any worktree,
one baseline per base branch. A newer baseline is never replaced by an older one. Ticket setup
inherits the base's baseline under the ticket branch's name. When none is usable (sha
`null`, incomplete, or stale fingerprint), setup records nothing; the first `composer test`
does the full run. The main checkout no longer re-pins anything. `start-ticket.sh`
fast-forwards the local base before branching, so the ticket and its inherited baseline share
history. This depends on merge commits: a squash merge takes the baseline's commit out of the
base's history, and Pest then ignores it.

**The toolkit owns the TIA operations.** Publish, inherit and check are
`nwrman/laravel-toolkit` artisan commands. The starter's scripts only call them. They depend
on Pest internals (cache location, baseline keys, pruning, reachability), so they ship with
the toolkit's Pest constraint and reach every descendant through `composer update`, instead of
drifting in per-descendant copies of `scripts/`.

**A filtered coverage gate is an error.** With TIA on, `toolkit:preflight` refuses a coverage
gate that carries a selection flag. Browser specs stay in the coverage run. TIA already limits
them to the ones a change can reach, which is the speed-up the exclusion was after.

## Consequences

- A merge that doesn't go through a ticket (a chore PR, a direct commit) publishes nothing.
  The next ticket stays correct and just re-runs what that merge touched.
- A brand-new descendant, a new integration branch, or a fingerprint change (`composer.lock`,
  `phpunit.xml`, vite config, node lockfile) starts with one full run. It happens in the first
  `composer test`, not during setup.
- A Browser spec that times out under coverage fails preflight like any other failure. It is
  not a reason to filter the gate.

## Amended 2026-10-30

The build loop moved into the software factory's `factory` plugin. The mechanism here stands, with new hands:
`herd.yml`'s `after_create` runs `toolkit:tia inherit` and its `before_delete` runs `toolkit:tia publish`;
`start-ticket.sh`, `worktree-setup.sh`, `worktree-teardown.sh` and `finish-ticket` are gone. The plugin's
`factory-start-ticket` cuts the worktree from the base's local state and no longer fast-forwards it: pull the base
first when the inherited commit must be the latest.
