import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
}: Props<TData>) {
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageSize = table.getState().pagination.pageSize;
  // Hide pagination entirely when all rows fit on a single page.
  if (totalRows <= pageSize) {
    return null;
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
      <div className="flex-1">
        {selectedCount > 0
          ? `${selectedCount} de ${totalRows} seleccionados`
          : `${totalRows} destinatarios`}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span>Por página</span>
          <select
            value={pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
