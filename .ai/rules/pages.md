---
paths:
  - 'resources/js/pages/**'
  - 'resources/js/config/navigation.ts'
  - 'app/Http/Controllers/**'
---

# Pages

## Instant visit or prefetch: decided by the page's kind
Before building a page or linking to one, decide its kind (docs/adr/0019):
- Panel page (dashboard, list, report): every page-specific prop is `Inertia::defer`red in the controller. Each section takes its data as optional and draws its own loading state: titles, icons, table search and column headers render at once, only figures/rows/plot areas pulse (`DataTable loading` + `loadingCell`, `ChartRingSkeleton`, `ChartBodySkeleton`, `ListSkeleton`, `KpiRow`). A placeholder takes the loaded content's size and shape (a table's full page of rows at the real row height, a ring for a donut, the list's own tile), so nothing moves when the data lands. Never blank a whole card with a `<Deferred>` fallback. Nothing may read an eager prop on first render. Link it with `component` (instant visit) AND `prefetch`.
- Record or filled form (detail, edit, settings): props eager. Link with `prefetch` only, never `component`: a form must not draw empty and then fill.
- Empty form (create page): `component` + `prefetch`.
Nav items set `component` in `resources/js/config/navigation.ts`; `navigation.test.ts` renders each instant page with shared props only and fails if it throws.
