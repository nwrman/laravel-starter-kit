import {
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  functionalUpdate,
  useTable,
} from '@tanstack/react-table';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  type DataTableColumnDef,
  type DataTableFeatures,
  type DataTableInstance,
  dataTableFeatures,
} from './features';

type DataTableProps<TData extends RowData> = {
  // Each column keeps its own value type, so the array is typed the way TanStack's own
  // `columnHelper.columns()` types it.
  // oxlint-disable-next-line typescript/no-explicit-any
  columns: DataTableColumnDef<TData, any>[];
  data: TData[];
  renderToolbar?: (table: DataTableInstance<TData>) => React.ReactNode;
  renderPagination?: (table: DataTableInstance<TData>) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  getRowId?: (row: TData, index: number) => string;
  emptyMessage?: string;
  initialPageSize?: number;
  /**
   * The rows have not arrived yet (a deferred prop): the toolbar and the column headers render
   * as usual, the body shows this many placeholder rows, and the pagination waits. docs/adr/0019.
   */
  loadingRows?: number;
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  renderToolbar,
  renderPagination,
  onRowClick,
  rowClassName,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  emptyMessage = 'Sin resultados.',
  initialPageSize = 25,
  loadingRows,
}: DataTableProps<TData>) {
  const [internalSelection, setInternalSelection] = React.useState<RowSelectionState>({});

  const selection = rowSelection ?? internalSelection;
  const setSelection = React.useCallback(
    (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => {
      const next = typeof updater === 'function' ? updater(selection) : updater;
      if (onRowSelectionChange) {
        onRowSelectionChange(next);
      } else {
        setInternalSelection(next);
      }
    },
    [selection, onRowSelectionChange],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // The table's own page reset is off (`autoResetPageIndex` below), because it also fires
  // whenever `data` changes, so a poll or a partial reload threw the reader back to page 1
  // (campaign-messenger's fix, ADR 0008). A new sort or filter still starts at page 1, here.
  const toFirstPage = <T,>(set: React.Dispatch<React.SetStateAction<T>>) => {
    return (updater: Updater<T>) => {
      set((previous) => functionalUpdate(updater, previous));
      setPagination((previous) =>
        previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 },
      );
    };
  };

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection: selection,
    },
    // The registry's accent-insensitive entry; the library's 'auto' bypasses the registry.
    globalFilterFn: 'includesString',
    enableRowSelection: true,
    onSortingChange: toFirstPage(setSorting),
    onColumnFiltersChange: toFirstPage(setColumnFilters),
    onGlobalFilterChange: toFirstPage(setGlobalFilter),
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelection,
    autoResetPageIndex: false,
  });

  // With the reset off, a refresh that returns fewer rows can leave the page past the new
  // last one, an empty table reading "Página 2 de 1". Step back to the last real page.
  const lastPageIndex = Math.max(table.getPageCount() - 1, 0);
  if (pagination.pageIndex > lastPageIndex) {
    setPagination({ ...pagination, pageIndex: lastPageIndex });
  }

  const handleRowClick = (row: Row<DataTableFeatures, TData>, event: React.MouseEvent) => {
    if (!onRowClick) return;
    // Ignore clicks that originated on an interactive element (checkbox, button, link).
    const target = event.target as HTMLElement;
    if (target.closest('button, input, a, [role="checkbox"], [data-slot="checkbox"]')) {
      return;
    }
    onRowClick(row.original);
  };

  return (
    <div className="flex flex-col gap-3">
      {renderToolbar?.(table)}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loadingRows !== undefined ? (
              Array.from({ length: loadingRows }, (_, index) => (
                <TableRow key={index} aria-hidden="true">
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell key={column.id}>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row.original))}
                  onClick={(event) => handleRowClick(row, event)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {loadingRows === undefined ? renderPagination?.(table) : null}
    </div>
  );
}
