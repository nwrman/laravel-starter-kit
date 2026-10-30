---
paths:
  - phpunit.xml
  - '**'
---

# General

## Coverage exclusions
**Every `<file>` exclusion states its reason and what removes it.** An exclusion for a deleted file does nothing and the gate still says pass — two dead entries (`Member/MembershipController.php`, `Quote/QuoteController.php`) survived here for months before being removed in #10. `tests/Unit/Scaffolding/CoverageExclusionsTest.php` enforces both directions: the path must exist and carry a `COVERAGE-EXCLUDED:` line with a `Remove when:` condition, and no file may carry that line without an entry.

**The database pin lives in `.ai/rules/database.md`.** `phpunit.xml` forces only `DB_CONNECTION=pgsql`; why `DB_DATABASE` is deliberately left unforced, and what keeps the suite off the development database, is written there.

## A ticket number in a comment must be one someone can act on
Before writing `#NN` in a comment, a docblock or a commit message, open it. `gh issue view NN` takes two seconds and is the difference between a pointer and a dead end.

Two kinds of reference, and they read differently:

- **Deferral** — "the screen for this is #42", "the real rows arrive through #40". This must name an **open** ticket whose scope actually covers the thing deferred. If no such ticket exists, the work is nobody's job: say so plainly in the comment, or open one. Never defer to a closed issue.
- **Decision record** — "settled in #6", "the reasoning is in #27". Closed is correct here, but say which kind it is, so a reader chasing the code does not land on a settled discussion expecting unwritten work.

Prefer a document over a number wherever one exists. `docs/adr/0013-...` outlives an issue reference and needs no network call to read.

Learned from a descendant where a closed planning issue was cited as "the import command" in ten places before anyone opened it.
