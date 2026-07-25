# 6. Default-on authorization and audit baseline

Date: 2026-07-24

## Status

Accepted

## Context

The descendant census exposed a pattern: every app that grew up re-added the same
two capabilities independently, on skewed versions. minuta added
spatie/laravel-permission v6 and spatie/laravel-activitylog **v4**;
campaign-messenger added activitylog **v5**; caudal's CONTEXT.md names "user
management, roles, permissions" as shared core; its approval flows imply audit
trails. Leaving these out of the starter guarantees each app wires them
differently — the exact drift the starter exists to prevent.

## Decision

- **spatie/laravel-permission, default-on, team-scoped roles.** A role assignment
  carries `team_id` (admin of one Team, viewer in another). One global
  **super-admin** flag, independent of teams, gates the Filament panel. When an
  app strips teams (ADR 0005), roles collapse to spatie's global (non-teams)
  mode via the same strip command.
- **spatie/laravel-activitylog, default-on, team-aware.** Entries record
  `team_id`; auth events and core models are pre-wired; apps opt further models
  in.

## Consequences

- Simple apps carry a dormant roles table and audit table — accepted cost, a
  table and a trait each.
- Version skew across apps ends: the starter pins the version; descendants
  inherit it at clone time.
- The Phase-2 audit viewer UI (roadmap) reads this log; the app-facing user
  management screens (Phase 1) assign these roles.
