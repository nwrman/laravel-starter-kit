# Architecture Decision Records

Records of architecturally significant decisions: what we chose, the trade-off,
and the consequences. An ADR is written when a decision is **hard to reverse**,
**surprising without context**, and **the result of a real trade-off**. Once
accepted, an ADR is immutable — supersede it with a new one rather than editing.

Undecided ideas are not ADRs; they live in [`../../plans/backlog.md`](../../plans/backlog.md)
until chosen and built.

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](0001-fortify-owns-all-auth-routes.md) | Fortify owns all authentication routes | Accepted |
| [0002](0002-tiered-form-convention.md) | Tiered form convention | Accepted |
| [0003](0003-no-dark-mode.md) | No dark mode / appearance system | Accepted |
| [0004](0004-deliberate-divergences-from-upstream.md) | Deliberate divergences from upstream | Accepted |
| [0005](0005-team-is-the-tenant.md) | Team is the tenant — single-DB scoping, strippable | Accepted |
| [0006](0006-default-on-permissions-and-audit.md) | Default-on authorization and audit baseline | Accepted |
| [0007](0007-typed-props-pipeline.md) | Typed props: laravel-data + typescript-transformer | Accepted |
| [0008](0008-starter-vs-toolkit-distribution.md) | Distribution model: starter template vs toolkit package | Accepted |
| [0009](0009-english-source-strings.md) | i18n: English source strings, Spanish first translation | Accepted |
| [0010](0010-upstream-sync-curated-review.md) | Upstream sync: scheduled curated review, not maestro | Accepted |
| [0011](0011-cloud-provisioning-distribution.md) | Laravel Cloud provisioning: toolkit stub plus a wizard skill | Accepted |
