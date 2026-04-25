import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  renderToolbar?: (table: TanstackTable<TData>) => React.ReactNode;
  renderPagination?: (table: TanstackTable<TData>) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  getRowId?: (row: TData, index: number) => string;
  emptyMessage?: string;
  initialPageSize?: number;
};

export function DataTable<TData, TValue>({
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
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

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: selection,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      setSelection(typeof updater === 'function' ? updater(selection) : updater);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: { pageSize: initialPageSize },
    },
  });

  const handleRowClick = (row: Row<TData>, event: React.MouseEvent) => {
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
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row.original))}
                  onClick={(event) => handleRowClick(row, event)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      {renderPagination?.(table)}
    </div>
  );
}
