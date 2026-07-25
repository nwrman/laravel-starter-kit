---
name: upstream-sync
description: Monthly curated review of laravel/react-starter-kit changes (ADR 0010). Use when the user says "upstream sync", "sync upstream", "review upstream", or asks what changed in the official Laravel starter kits.
---

# Upstream Sync

## Overview

This starter has no shared git history with `laravel/react-starter-kit` — sync is a
**curated review**: read upstream's commits, triage each against our ADRs, port only
what the maintainer approves, and log every verdict so nothing is re-litigated. Run
monthly, locally, by the maintainer. See `docs/adr/0010-upstream-sync-curated-review.md`
and the state file `docs/upstream-sync.md`.

## Workflow

### Step 1 — Load state

Read `docs/upstream-sync.md`:
- the **marker** (last reviewed upstream SHA; first run: window starts 2026-06-01)
- the **standing auto-skips** table (ADR-rejected change types)

### Step 2 — Fetch upstream commits since the marker

```bash
git clone --bare --filter=blob:none https://github.com/laravel/react-starter-kit \
  "$SCRATCHPAD/upstream" 2>/dev/null || gh api 'repos/laravel/react-starter-kit/commits?since=...'
git -C "$SCRATCHPAD/upstream" log --date=short --pretty='%h %ad %s' <marker>..HEAD
```

(On first run, filter by date instead of the `<marker>..` range.)

### Step 3 — Triage every commit into exactly one bucket

| Bucket | Meaning | Action |
|---|---|---|
| **AUTO-SKIP** | Matches a standing auto-skip row / ADR rejection | Log reason + ADR number |
| **CANDIDATE** | Plausibly applies to this fork | One line on why + likely local file(s) |
| **NOISE** | Dependency bumps, CI churn, skeleton syncs | Count only, don't list |

Present the triage to the maintainer in-session as a table. **Never port anything
without explicit approval.**

### Step 4 — Port approved candidates

For each approved item: inspect the upstream diff (`git -C "$SCRATCHPAD/upstream" show <sha>`),
adapt it to this repo's conventions (bun/oxlint, Pest, our passkeys implementation —
port *ideas*, not files, where implementations differ), add/update tests, and run the
narrowest relevant suite plus `composer preflight` before finishing.

### Step 5 — Update the state file

In `docs/upstream-sync.md`:
- append one triage-log row per reviewed commit (date, SHA, change, verdict, notes)
- move the **marker** to the newest upstream SHA reviewed
- update the review date

Commit the ports and the state file together (starter first — descendants pick ports
up under the ADR 0008 process rule).

## Common Mistakes

- **Re-proposing a logged skip** — check the triage log and standing auto-skips before
  listing candidates; skips are as binding as ADR rejections.
- **Porting upstream files verbatim** — upstream uses npm/eslint/PHPUnit and its own
  passkeys implementation; adapt to this repo's stack.
- **Forgetting the marker** — if the marker doesn't move, the next run re-triages
  everything.
