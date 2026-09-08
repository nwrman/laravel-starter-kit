---
paths:
  - tests/Pest.php
---

# Tests

## TIA ordering: record before you measure
A coverage run cannot *record* the TIA graph, only replay against one. So `composer test:fast` has to run at least once before `composer preflight` can use the graph.

Getting the order wrong fails nothing — preflight just quietly stays slow. That silence is why a bogus workaround (unregistering TIA under `--coverage`) survived in a descendant for weeks before anyone checked it. Pest 5.1 has piggyback coverage for exactly this case: it caches the full report beside the graph and merges it with the freshly measured tests.

`locally()` does not detect CI. Pest reads a literal `--ci` argument and nothing else, so the CI workflow must pass it — see the workflows rule.
