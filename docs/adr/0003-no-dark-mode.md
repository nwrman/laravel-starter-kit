# 3. No dark mode / appearance system

Date: 2026-07-24

## Status

Accepted

## Context

The official Laravel React starter kit ships an appearance/theme system: a
`HandleAppearance` middleware, a `use-appearance` hook, an `appearance-tabs.tsx`
component, and a `settings/appearance.tsx` page that let users switch between
light, dark, and system themes.

Because we track upstream, adopting it is the path of least resistance — the code
is right there. A future contributor pulling from upstream will keep re-proposing
it. This ADR exists so that pull is a decision, not an accident.

## Decision

Dark mode and the appearance/theme system are **out of scope**. We do not adopt
`HandleAppearance`, `use-appearance`, `appearance-tabs.tsx`, or
`settings/appearance.tsx`. The app is light-mode only.

## Consequences

- Every visual surface can assume a single light theme; components need no dark
  variants and no theme-branching.
- When merging from upstream, the appearance system is explicitly skipped.
- Revisiting this is cheap in principle, but it would reintroduce theme handling
  across the whole UI, so it should be a deliberate reversal of this ADR rather
  than a quiet backport.
