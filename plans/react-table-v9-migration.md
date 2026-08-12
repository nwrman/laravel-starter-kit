# Handoff: migrate the data table to @tanstack/react-table v9

**Status:** not started
**Scope:** starter kit only. Descendants follow later, per [ADR 0008](../docs/adr/0008-starter-vs-toolkit-distribution.md).
**Supersedes** the `@tanstack/react-table` v9 entry under "Frontend" in [backlog.md](backlog.md).

## Read this first: the pin was deliberate

`^8.21.3` was pinned on 2026-08-11 on purpose. The backlog records the reasoning: v9 is an API
rewrite, and the migration was deferred because **the server-driven data-table work rewrites this
code anyway** — the intent was to decide v8-vs-v9 there rather than migrate twice.

That reasoning still holds. Before starting, settle one question: **is the server-driven
data-table work close enough that this should wait for it?** If yes, close this handoff and leave
the pin. If it has slipped far enough out, proceed — but know you are reversing a decision that
was made with a reason, not by neglect.

Note that `composer update` runs `update:requirements` (`composer bump` + `ncu -u`), which will
keep re-proposing `^9` on every dependency change. Re-pin unless you are actually migrating.
This is how the topic resurfaced: a `composer require` for `league/flysystem-aws-s3-v3` silently
rewrote `package.json` to `^9.1.2`, and the bump was reverted.

## The good news: there is a mechanical path

v9 ships a **`./legacy` subpath** that re-exports the entire v8 surface this codebase uses.
Confirmed against `@tanstack/react-table@9.1.2`:

`@tanstack/react-table/legacy` exports `useLegacyTable`, `legacyCreateColumnHelper`, every row
model getter (`getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`,
`getPaginationRowModel`, `getFacetedRowModel`, `getFacetedUniqueValues`, plus expanded, grouped
and min-max), and the legacy types `LegacyColumnDef`, `LegacyTable`, `LegacyColumn`, `LegacyRow`,
`LegacyCell`, `LegacyHeader`, `LegacyHeaderGroup`.

`flexRender` stays on the **root** export — unchanged, no move needed.

So there are two routes, and they are very different sizes of job.

### Route A — legacy shim (recommended first move)

Bump to v9 and rewrite imports only. No logic changes, no restructuring. Roughly:

- `useReactTable` → `useLegacyTable`, imported from `@tanstack/react-table/legacy`
- row model getters → same names, imported from `@tanstack/react-table/legacy`
- `ColumnDef` → `LegacyColumnDef`, `Table` → `LegacyTable`, `Column` → `LegacyColumn`,
  `Row` → `LegacyRow`
- `flexRender` stays as-is

Hours, not days. Gets off v8, unblocks `ncu`, and leaves the real migration for when the
server-driven work defines the shape. The cost is that you do not get v9's tree-shaking, which
is the entire point of the release — the legacy shim necessarily pulls in the features it
emulates.

### Route B — native v9

The real thing. v9 requires every table to declare its capabilities so unused features shake out
of the bundle:

```ts
const features = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

const table = useTable({ features, columns, data })
```

Confirmed changes:

- `useReactTable` → `useTable`, and a `features` option is now required
- row models move inside `tableFeatures()` and become factories: `getFilteredRowModel()` →
  `filteredRowModel: createFilteredRowModel()`, and likewise sorted and paginated
- `getCoreRowModel()` is gone — the core row model is automatic
- each capability needs its feature object registered (`columnFilteringFeature`,
  `rowSortingFeature`, `rowPaginationFeature`, …)
- filter and sort functions are registered explicitly, e.g.
  `filterFns: { includesString: filterFn_includesString }`

Still to verify for Route B:

- feature object names for **row selection** and **column visibility** — both are used here and
  I did not confirm their names
- the faceting equivalents of `getFacetedRowModel` / `getFacetedUniqueValues`
- whether `SortingState`, `ColumnFiltersState`, `VisibilityState` and `RowSelectionState` keep
  their names — the root re-exports `@tanstack/table-core` wholesale, so they are probably still
  reachable, but confirm
- **do the types now take a features type parameter?** This is the main typing risk: four files
  pass `Table<TData>` through props, and a `Table<TFeatures, TData>` shape ripples into every
  consumer signature
- whether the controlled-state pattern (`state` + `onSortingChange` / `onColumnFiltersChange` /
  `onColumnVisibilityChange` / `onRowSelectionChange`) is unchanged
- whether `initialState.pagination.pageSize` and `autoResetPageIndex` survive

## What has to change

Eight files, ~960 lines:

| File | react-table surface |
|---|---|
| `components/data-table/data-table.tsx` | the whole call — six row models, controlled state, row selection, `initialState.pagination` |
| `components/data-table/data-table-pagination.tsx` | `type Table` in props |
| `components/data-table/data-table-toolbar.tsx` | `type Table` in props |
| `components/data-table/data-table-column-header.tsx` | `type Column` in props |
| `components/demo/project-table.tsx` | `ColumnDef`, `flexRender`, `getCoreRowModel`, `useReactTable` |
| `components/demo/team-table.tsx` | same as above |
| `components/data-table/data-table.test.tsx` | `type ColumnDef` |
| `components/data-table/data-table-pagination.test.tsx` | `type ColumnDef` |

`data-table.tsx:74-100` is the centre: one `useReactTable` call wiring all six row models, four
pieces of controlled state, and row selection. The two demo tables build their own tables with
`getCoreRowModel` only — convert those first either way, to learn the shape on the cheap cases.

## Fold in the trapped fix while you are here

campaign-messenger fixed a real bug that never flowed back: `data-table.tsx:99` there has
`autoResetPageIndex: false`, with a regression test at `data-table.test.tsx:132`. Without it the
table snaps to page 1 on every poll refresh. The starter still lacks both, and ADR 0008 names
this exact case as documented drift. Whichever route you take rewrites that call — port the fix
and its test in the same pass.

## Blast radius

All five descendants carry their own copies and all sit on `^8.21.3`: talok-app (6 files),
campaign-messenger (6), cooperativa (6), my-life-hub (8), anidigraf-socios (6).

Do **not** migrate them in this pass. Land it in the starter, let it prove itself in one app,
then let descendants pull it on their next sync. That is the ADR 0008 rule.

## Steps (Route A)

1. Confirm the server-driven data-table work is far enough out to justify moving now.
2. `bun add @tanstack/react-table@^9` on its own branch. Watch that nothing else gets bumped —
   `post-update-cmd` runs `ncu -u` on any `composer require`.
3. Convert `demo/team-table.tsx`, then `demo/project-table.tsx`.
4. Convert `data-table.tsx`, and add `autoResetPageIndex: false`.
5. Fix the `Table` / `Column` prop types in pagination, toolbar and column-header.
6. Port campaign-messenger's `autoResetPageIndex` regression test.
7. `bun run test:ui`, then `composer test`, then `composer preflight`.

## Done when

- `composer preflight` is green: 100% type coverage, PHPStan, lint, both suites.
- Projects and Team pages still sort, filter, paginate, select rows and toggle column visibility
  when clicked through in a browser — the tests cover the components, not the wiring.
- Pagination survives a refresh (the `autoResetPageIndex` case).
- `grep -rn "@tanstack/react-table'" resources/js` shows only the intended import paths.

## Risk

Route A is low risk and reversible. Route B is a rewrite of the most-reused component in the
lineage, whose payoff is bundle size rather than a feature, on code that is already scheduled to
be rewritten by the server-driven data-table work. Taking Route B now is the option most likely
to be wasted effort.
