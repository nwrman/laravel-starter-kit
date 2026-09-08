---
paths:
  - 'patches/**'
---

# Patches

## A patch outlives its need in silence
The `patch` composer script guards each patch with a feature check and swallows the result (`|| true`). Once upstream ships the fix, the check stops matching and the patch stops applying — with no output, on every install, indefinitely.

`patches/pest-parallel-coverage.patch` has been dead since Pest 5.1, which is this project's floor. Raising a dependency's floor past a patch means deleting the patch and its script entry, not leaving them to no-op.

A test will assert every patch here is still needed against the installed version in `composer.lock` (#11, not yet written).
