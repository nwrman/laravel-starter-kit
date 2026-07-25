# 8. Distribution model: starter template vs toolkit package

Date: 2026-07-24

## Status

Accepted

## Context

The starter now has six descendants (talok-app, campaign-messenger, cooperativa,
my-life-hub, expo-scheduler, admin-canacar-v2) plus adjacent lineages (minuta).
Two reuse channels already exist: clone-the-template (drift accepted, fixes
travel by hand) and the `nwrman/laravel-toolkit` composer package (fixes flow
via `composer update`).

The cost of misfiling is documented drift, found in the wild during the census:

- talok's registration/build fix had to be hand-ported back to the starter.
- campaign-messenger fixed a data-table bug (`autoResetPageIndex: false` — table
  snapped to page 1 on every poll refresh) that never flowed anywhere.
- my-life-hub wrote tests for shared components the starter still lacks.
- WhatsApp/Meta plumbing was built twice independently (campaign-messenger's
  full integration suite; expo-scheduler's `MetaWhatsAppService`).
- admin-canacar-v2 is a stale pre-Fortify snapshot of the starter.

## Decision

One sorting rule, applied per capability:

> **Apps will edit it → starter template.**
> **Apps never edit it, and fixes must reach every app → toolkit package.**

The toolkit is the **only** carrier package — no per-feature packages; optional
capabilities ship as toolkit modules that stay dormant unless configured.

Toolkit-bound: passkey security glue (rate limiters, login guard, secret
pinning), session-expired *detection* (modal UI stays app-side), the
`RecordLastLogin` listener, the Telegram notification channel (generalizing
talok's), the teams strip/scaffold command (ADR 0005), and the WhatsApp +
channel-driver machinery (campaign-messenger's `ChannelManager`/`ChannelDriver`
+ Meta integration; templates and flows stay app-side).

Everything else — teams, permissions, audit, all pages and UI, Filament, typed
props — is starter template: apps clone, edit, and drift freely.

**Process rule:** a fix or feature that is shared-shaped lands in the starter or
toolkit *first*, then flows outward. Never only in a descendant.

## Consequences

- Deliberately **out of both**: billing (recipe doc — Cashier-on-Team per
  minuta), AI plumbing (two apps, two unconverged stacks — nothing to
  standardize yet), DB-per-tenant (caudal/raudal's own layer), and minuta's
  plan-limits / onboarding-checklist / folio-generator (stay minuta-only by
  explicit choice).
- The census's trapped fixes become the roadmap's Phase-1 sync pass.
- Toolkit gains modules but no new repos: one release train.
