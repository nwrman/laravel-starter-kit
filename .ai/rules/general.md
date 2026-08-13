---
paths:
  - phpunit.xml
  - '**'
---

# General

## Coverage exclusions and the sqlite pin
**Every `<file>` exclusion states its reason and what removes it.** An exclusion for a deleted file does nothing and the gate still says pass — two dead entries survived here for months (`Member/MembershipController.php`, `Quote/QuoteController.php`). A test will enforce both directions — the path must exist, and it must carry a reason (#11, not yet written).

**The sqlite pin is a default, not a fact.** `DB_CONNECTION=sqlite` / `DB_DATABASE=:memory:` are `force="true"`, so nothing can override them — not `.env.testing`, not the per-worktree database `worktree-setup.sh` provisions. Switching drivers means removing that pin as a unit. ADR 0013 has the reasoning; the step-by-step procedure is #13, not yet written.

**Off sqlite, isolation is not automatic — and there is no guard yet (#12).** `composer test` runs through `php artisan toolkit:report`, an artisan parent that loads `.env`, and `RefreshDatabase` drops whatever it points at. Until the guard lands, switching drivers without isolating the test database wipes your development data. The planned guard refuses to run unless the connection is sqlite or the database name ends in `_test` — the suffix `worktree-setup.sh` already uses.

## A ticket number in a comment must be one someone can act on
Before writing `#NN` in a comment, a docblock or a commit message, open it. `gh issue view NN` takes two seconds and is the difference between a pointer and a dead end.

Two kinds of reference, and they read differently:

- **Deferral** — "the screen for this is #42", "the real rows arrive through #40". This must name an **open** ticket whose scope actually covers the thing deferred. If no such ticket exists, the work is nobody's job: say so plainly in the comment, or open one. Never defer to a closed issue.
- **Decision record** — "settled in #6", "the reasoning is in #27". Closed is correct here, but say which kind it is, so a reader chasing the code does not land on a settled discussion expecting unwritten work.

Prefer a document over a number wherever one exists. `docs/adr/0013-...` outlives an issue reference and needs no network call to read.

Learned from a descendant where a closed planning issue was cited as "the import command" in ten places before anyone opened it.
