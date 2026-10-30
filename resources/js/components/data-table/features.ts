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
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/react-table';

/**
 * The TanStack Table v9 features every DataTable registers. v9 exposes an API only when
 * its feature is listed here, so a column or toolbar that needs another one (pinning,
 * grouping, …) adds it here rather than per table.
 *
 * The full `filterFns` and `sortFns` registries keep v8's behaviour: `'auto'` resolves
 * against every built-in, and string names such as `'arrIncludesSome'` keep working.
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
  filterFns,
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
