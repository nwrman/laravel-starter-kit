---
paths:
  - '.github/workflows/**'
---

# Workflows

## CI traps that fail silently
These four cost a descendant a week (SEAPTIdev/anidigraf-members#51). None of them turn anything red.

- `hashFiles()` on a path that does not exist returns an empty string, so the cache key becomes a constant and every run restores the same frozen `node_modules` forever. This repo hashed `bun.lockb`; the file is `bun.lock`. That stale tree is what made the Build lane fail with `new _lruCache(...)` for five runs straight.
- `shivammathur/setup-php` installs the production ini, where `zend.assertions=-1` strips `assert()` at parse time. Those lines then read as uncovered and only on CI, so `--exactly=100.0` fails in a way no developer machine reproduces. Pass `ini-values: zend.assertions=1`.
- Pest decides it is on CI from a literal `--ci` argument and nothing else — it never reads `CI` or `GITHUB_ACTIONS`. Without the flag, TIA switches itself on in the runner. Harmless on a fresh runner with no graph, but the full-run guarantee then rests on an accident.
- A lane that copies `.env.example` inherits its driver. Any lane without a database service must neutralise it after the copy, or it goes red the first time something queries at boot.

Also here: `restore-keys` must share the primary key's prefix. `${{ runner.os }}-bun-` can never match a key saved under `${{ github.repository }}-bun-`, so partial restores silently never happen.
