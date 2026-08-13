---
paths:
  - phpunit.xml
---

# General

## Coverage exclusions and the sqlite pin
**Every `<file>` exclusion states its reason and what removes it.** An exclusion for a deleted file does nothing and the gate still says pass — two dead entries survived here for months (`Member/MembershipController.php`, `Quote/QuoteController.php`). A test will enforce both directions — the path must exist, and it must carry a reason (#11, not yet written).

**The sqlite pin is a default, not a fact.** `DB_CONNECTION=sqlite` / `DB_DATABASE=:memory:` are `force="true"`, so nothing can override them — not `.env.testing`, not the per-worktree database `worktree-setup.sh` provisions. Switching drivers means removing that pin as a unit. ADR 0013 has the reasoning; the step-by-step procedure is #13, not yet written.

**Off sqlite, isolation is not automatic — and there is no guard yet (#12).** `composer test` runs through `php artisan toolkit:report`, an artisan parent that loads `.env`, and `RefreshDatabase` drops whatever it points at. Until the guard lands, switching drivers without isolating the test database wipes your development data. The planned guard refuses to run unless the connection is sqlite or the database name ends in `_test` — the suffix `worktree-setup.sh` already uses.
