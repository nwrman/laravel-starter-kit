# 5. Team is the tenant — single-DB scoping, strippable

Date: 2026-07-24

## Status

Accepted

## Context

The starter must serve three shapes of app at once: simple single-tenant tools
(talok, campaign-messenger), team-based SaaS (minuta's *Negocio*), and
platform products with database-per-tenant isolation (caudal, raudal — whose own
docs claim that layer as *their* shared core). The portfolio used three words for
the paying-organization concept: Negocio, Tenant/Distributor, team.

Two shapes were considered: one entity (the Team **is** the company account,
Jetstream-style) or two (a Tenant containing Teams as workgroups). Nobody in the
portfolio needs the double layer; caudal's sub-structure (Branch/Plaza) is a
domain entity inside caudal, not an access boundary.

Delivery was also contested: always-on with auto-created personal teams (one code
shape, dormant UI in simple apps) versus opt-in at scaffold time.

## Decision

- **One entity: Team = tenant.** Every scoped record carries `team_id`. A User
  belongs to one or more Teams and acts within a current Team. Canonical
  vocabulary lives in `CONTEXT.md`.
- **Single shared database, row-level scoping.** This is the starter's only
  isolation strategy. Products needing stronger isolation (caudal/raudal's
  DB-per-tenant) replace the strategy in their own codebase; the starter must not
  make that swap harder.
- **Teams are opt-in at scaffold, delivered by stripping.** The canonical,
  daily-tested starter shape **includes** teams. A scaffold command
  (toolkit-owned, e.g. `--no-teams`) mechanically deletes the Team model,
  migrations, middleware, switcher UI, and team tests. The teams-less shape is
  derived, never separately maintained; CI runs the stripper and full preflight
  to prove both shapes green.
- Harvest, don't rebuild: minuta's `Team`, `TeamInvite`, `team-switcher`,
  `create-team-dialog`, `TeamMemberSelector` are the implementation source.

## Consequences

- Rejected: two starter branches (every fix lands twice) and stub-injection
  installs (stubs nobody runs daily rot).
- Downstream products may rename the concept in UI (Negocio, Distributor); the
  code-level term stays Team.
- Every future starter feature must state whether it is team-scoped and must
  survive the strip command.
