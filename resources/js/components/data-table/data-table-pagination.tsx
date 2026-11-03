import type { RowData } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as React from 'react';
import { flushSync } from 'react-dom';
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
  const pageIndex = table.state.pagination.pageIndex;
  const previousRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  // A page button disables itself at the end it moves to, and a disabled button drops
  // keyboard focus to <body>. Commit the move, then hand focus to the button pointing
  // the other way, which is enabled by then.
  const goTo = (target: number) => {
    flushSync(() => table.setPageIndex(target));
    if (target === 0) {
      nextRef.current?.focus();
    } else if (target === pageCount - 1) {
      previousRef.current?.focus();
    }
  };
  // The size picker stays while a smaller size could still split the rows, so choosing a
  // size that fits everything on one page never takes away the way back.
  const showPageSize = totalRows > Math.min(...pageSizeOptions);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <div className="whitespace-nowrap">
        {selectedCount > 0
          ? `${selectedCount} de ${totalRows} ${selectedCount === 1 ? 'seleccionado' : 'seleccionados'}`
          : `${totalRows} ${totalRows === 1 ? 'resultado' : 'resultados'}`}
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
              Página {pageIndex + 1} de {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Primera página"
                onClick={() => goTo(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                ref={previousRef}
                aria-label="Página anterior"
                onClick={() => goTo(pageIndex - 1)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                ref={nextRef}
                aria-label="Página siguiente"
                onClick={() => goTo(pageIndex + 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Última página"
                onClick={() => goTo(pageCount - 1)}
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
