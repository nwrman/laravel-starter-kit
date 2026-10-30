import type { RowData } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataTableInstance } from './features';

type Props<TData extends RowData> = {
  table: DataTableInstance<TData>;
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData extends RowData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
}: Props<TData>) {
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageSize = table.state.pagination.pageSize;
  const pageCount = table.getPageCount();
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  // The size picker stays while a smaller size could still split the rows, so choosing a
  // size that fits everything on one page never takes away the way back.
  const showPageSize = totalRows > Math.min(...pageSizeOptions);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <div className="whitespace-nowrap">
        {selectedCount > 0
          ? `${selectedCount} de ${totalRows} seleccionados`
          : `${totalRows} resultados`}
      </div>
      <div className="flex items-center gap-4">
        {showPageSize ? (
          <label className="flex items-center gap-2 whitespace-nowrap">
            <span className="hidden sm:inline">Por página</span>
            <select
              value={pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
              aria-label="Filas por página"
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {pageCount > 1 ? (
          <>
            <span className="whitespace-nowrap">
              Página {table.state.pagination.pageIndex + 1} de {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Primera página"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Página anterior"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Página siguiente"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Última página"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
