# Starter Kit — Domain Context

Vocabulary for the starter itself and every app cloned from it. App-specific terms live in
each app's own CONTEXT.md (see `caudal/docs/CONTEXT.md`, `raudal/docs/CONTEXT.md`).

## Language

**Team**:
The unit of data isolation — the paying organization, the "company account". One entity,
one table; every scoped record carries a `team_id`. A User belongs to one or more Teams
and acts within a current Team. In single-tenant apps the whole app is effectively one Team.
Downstream products may rename the concept in their UI (minuta: *Negocio*; raudal:
*Distributor*) but the code-level term is Team.
_Avoid_: Tenant (reserved for platform-level DB-per-tenant isolation, which the starter does
not implement), Organization, Account, Company, Negocio (minuta UI term).

**Scoping**:
Row-level isolation by `team_id` within the single shared database. This is the starter's
only isolation strategy; products needing stronger isolation (caudal/raudal's
database-per-tenant) replace the strategy in their own codebase — the starter must not make
that swap harder.
_Avoid_: multi-tenancy (ambiguous — names both this and DB-per-tenant).

**Starter**:
This repository — the template every new app clones. Holds everything apps will
edit: pages, UI, models, theme. Fixes travel to descendants by manual backport;
drift is accepted.
_Avoid_: framework, base, boilerplate (caudal reserves "Shared Core" for its own layer).

**Toolkit**:
The `nwrman/laravel-toolkit` composer package — the only carrier for shared code
apps never edit (fixes flow via `composer update`). Optional capabilities ship as
dormant modules inside it, not as separate packages.

**Descendant**:
An app cloned from the Starter. It drifts freely; shared-shaped fixes must land
in Starter or Toolkit first, then flow outward.
_Avoid_: fork (reserved for the starter's own relationship to Laravel's official kit).

**Recipe**:
A documented pattern pointing at a proven implementation in a descendant (e.g.
billing = Cashier-on-Team as done in minuta). Copied by hand when needed; not
starter code, not toolkit code.

## Relationships

- A **User** belongs to one or more **Teams**; at any moment they act within one current Team.
- Every scoped record belongs to exactly one **Team**.
- Platform-style products (caudal, raudal) build their own tenancy layer *on top of* or
  *instead of* Team scoping; the starter does not carry Branch/Module-Entitlement concepts.
- A **Descendant** clones the **Starter** once and requires the **Toolkit** forever;
  what it cannot get from either, it copies from a **Recipe**.
