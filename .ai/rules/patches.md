---
paths:
  - 'patches/**'
---

# Patches

## A patch outlives its need in silence
The `patch` composer script guards each patch with a feature check and swallows the result (`|| true`). Once upstream ships the fix, the check stops matching and the patch stops applying — with no output, on every install, indefinitely.

Raising a dependency's floor past a patch means deleting the patch **and** its script entry, not leaving them to no-op. Every patch needs a header naming the upstream version that retires it, so the check is a lookup rather than an investigation.

No patches today. Two have come and gone: `patches/pest-parallel-coverage.patch` was removed once Pest 5.1 — the project's floor — shipped that `setData` call upstream, after silently skipping on every install for months; `patches/wayfinder-query-method.patch`, which added `"query"` to Wayfinder's TypeScript `Method` union after Laravel 13.35's QUERY verb broke it (laravel/wayfinder#326), was removed with the `patch` script when the floor rose to Wayfinder 0.1.23. Add a patch only when one is genuinely needed, and the `patch` composer script with it.

`tests/Unit/Scaffolding/PatchesTest.php` enforces this: each patch carries a `Retire when: vendor/package >= x.y.z` header, is referenced by a composer script, and fails the suite once `composer.lock` reaches that version.
