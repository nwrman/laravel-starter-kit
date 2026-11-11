---
paths:
  - 'resources/js/pages/**'
  - 'resources/js/config/navigation.ts'
  - 'app/Http/Controllers/**'
---

# Pages

## Instant visit or prefetch: decided by the page's kind
Before building a page or linking to one, decide its kind (docs/adr/0019):
- Panel page (dashboard, list, report): every page-specific prop is `Inertia::defer`red in the controller and drawn behind `<Deferred fallback={skeleton}>`. Nothing may read an eager prop on first render. Link it with `component` (instant visit) AND `prefetch`.
- Record or filled form (detail, edit, settings): props eager. Link with `prefetch` only, never `component`: a form must not draw empty and then fill.
- Empty form (create page): `component` + `prefetch`.
Nav items set `component` in `resources/js/config/navigation.ts`; `navigation.test.ts` renders each instant page with shared props only and fails if it throws.
