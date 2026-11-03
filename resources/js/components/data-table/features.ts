import {
  type CellData,
  type ColumnDef,
  type ReactTable,
  type RowData,
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  constructFilterFn,
  filterFn_includesString,
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/react-table';
import { normalizeForSearch } from '@/lib/utils';

// "movil" finds "Móvil": both sides go through the app's one search normalizer.
const includesStringIgnoringAccents = constructFilterFn({
  ...filterFn_includesString,
  resolveFilterValue: (value) => normalizeForSearch(String(value ?? '')),
  resolveDataValue: (value) => (value == null ? undefined : normalizeForSearch(String(value))),
});

/**
 * The TanStack Table v9 features every DataTable registers. v9 exposes an API only when
 * its feature is listed here, so a column or toolbar that needs another one (pinning,
 * grouping, …) adds it here rather than per table.
 *
 * The full `filterFns` and `sortFns` registries keep v8's behaviour: `'auto'` resolves
 * against every built-in, and string names such as `'arrIncludesSome'` keep working.
 * `includesString`, the one `'auto'` picks for text and the one `DataTable` points its
 * global search at, ignores accents: Spanish copy is full of them.
 *
 * Under the React Compiler, a component that receives a `row`, `column` or `cell` and
 * reads state through one of its methods (`getIsSorted()`, `getIsSelected()`, …) is
 * memoized against an object that never changes, and freezes. Read that state through
 * `<Subscribe>` inside the component, as `DataTableColumnHeader` does.
 */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns: { ...filterFns, includesString: includesStringIgnoringAccents },
  sortFns,
});

export type DataTableFeatures = typeof dataTableFeatures;

/** A column for `DataTable`: v9's `ColumnDef` with the DataTable features filled in. */
export type DataTableColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = ColumnDef<DataTableFeatures, TData, TValue>;

/** The table instance `DataTable` hands to `renderToolbar` and `renderPagination`. */
export type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>;
