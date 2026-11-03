---
paths:
  - 'resources/js/**'
---

# Js

## Client-side search ignores accents
Every client-side text search must match regardless of accents and case, so "movil" finds "Móvil" (Spanish UI). Fold both the query and the text with `normalizeForSearch` from `@/lib/utils`; never compare with a bare `toLowerCase().includes()`. The shared pieces already do it: `DataTable` registers an accent-insensitive `includesString` (in `components/data-table/features.ts`, used for its global search and as the `'auto'` text filter), and `components/ui/command.tsx` defaults `Command`'s `filter` to cmdk's `defaultFilter` over folded text. A table built outside `DataTable`, or a `Command` given its own `filter`, must do the same. `ui/command.tsx` is a shadcn file: re-apply the default `filter` after any `shadcn add command --overwrite`.
