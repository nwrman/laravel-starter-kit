import { type CellData, type Column, type RowData, Subscribe } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DataTableFeatures } from './features';

type Props<TData extends RowData, TValue extends CellData> = {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData extends RowData, TValue extends CellData>({
  column,
  title,
  className,
}: Props<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <span
        className={cn(
          'text-xs font-medium tracking-wide text-muted-foreground uppercase',
          className,
        )}
      >
        {title}
      </span>
    );
  }

  // `column` is the same object on every render, so the React Compiler memoizes this
  // component and a `column.getIsSorted()` read here would go stale: the arrow never
  // flipped and a second click sorted ascending again. Subscribing to the table's sorting
  // state re-renders the button whenever it changes.
  return (
    <Subscribe
      source={column.table.store}
      selector={(state) => state.sorting.find((sort) => sort.id === column.id)}
    >
      {(sort) => {
        const sorted = sort ? (sort.desc ? 'desc' : 'asc') : false;

        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              '-ml-2 h-8 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
              sorted && 'text-foreground',
              className,
            )}
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            <span>{title}</span>
            {sorted === 'desc' ? (
              <ArrowDown className="size-3.5" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5 opacity-50" />
            )}
          </Button>
        );
      }}
    </Subscribe>
  );
}
