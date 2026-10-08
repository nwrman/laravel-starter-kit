---
paths:
  - 'patches/**'
---

# Patches

## A patch outlives its need in silence
The `patch` composer script guards each patch with a feature check and swallows the result (`|| true`). Once upstream ships the fix, the check stops matching and the patch stops applying — with no output, on every install, indefinitely.

Raising a dependency's floor past a patch means deleting the patch **and** its script entry, not leaving them to no-op. Every patch needs a header naming the upstream version that retires it, so the check is a lookup rather than an investigation.

There are no patches in this repo today. `patches/pest-parallel-coverage.patch` and the whole `patch` script were removed once Pest 5.1 — the project's floor — shipped that `setData` call upstream; it had been silently skipping on every install for months. This directory is recreated only when a new patch is genuinely needed.

`tests/Unit/Scaffolding/PatchesTest.php` enforces this: each patch carries a `Retire when: vendor/package >= x.y.z` header, is referenced by a composer script, and fails the suite once `composer.lock` reaches that version.
