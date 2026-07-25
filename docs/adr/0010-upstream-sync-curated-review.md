# 10. Upstream sync: scheduled curated review, not maestro

Date: 2026-07-24

## Status

Accepted

## Context

The starter began from its own scaffold commit — it shares no git history with
`laravel/react-starter-kit`, so `git merge upstream` is structurally impossible.
Upstream is highly active (commits every few days) and ships changes we want:
their Jul 14 2026 two-factor-modal-resume fix likely applies to our
`two-factor-setup-modal.tsx`; their passkey well-known endpoint (Jun 11)
improves passkey UX. It also ships changes our ADRs explicitly reject (dark
mode, npm/eslint/PHPUnit toolchain) and features we built differently
(passkeys).

`laravel/maestro` was evaluated: it is Laravel's internal factory that
generates the four official kit repos (React, Vue, Livewire, Svelte) from
layered shared source. Its payoff is deduplication across many variants; we
maintain exactly one. Adopting it means forking an undocumented-for-third-party
build system to regenerate a single output we already have.

The one-time manual comparison (`plans/adopt-official-starter-kit.md`, now
executed and deleted) proved the curated-review approach: read upstream's
changes, triage against our decisions, port as small curated commits.

## Decision

- **No maestro.** Revisit only if we ever maintain multiple starter variants.
- **Monthly curated review, run locally.** The maintainer runs the
  `/upstream-sync` skill (`.ai/skills/upstream-sync/`) in a local session: it
  fetches upstream commits since the marker in `docs/upstream-sync.md`,
  auto-skips what existing ADRs reject (logging the reason), and presents
  adoption candidates. **Nothing is ported without explicit approval.**
  _Amended 2026-07-24: originally a scheduled cloud routine; after one test run
  the maintainer chose local execution instead — the cloud routine
  (`trig_01RhFumAkt2KjEsKy7Nx3buv`) is disabled, kept for reference._
- `docs/upstream-sync.md` records the last-reviewed upstream SHA and every
  triage verdict (adopted / adapted / skipped + why), so rejected items are
  never re-litigated.
- Adopted ports land in the starter first and flow to descendants under the
  ADR 0008 process rule.

## Consequences

- First run catches up from 2026-06-01 (known missed items: the 2FA modal fix,
  passkey well-known endpoint).
- The routine's failure mode is a missing report, never wrong code.
- Skips are as binding as ADRs' "considered & rejected" — re-open one only with
  new evidence.
