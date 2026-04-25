import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props<TData> = {
  table: Table<TData>;
  searchPlaceholder?: string;
  /** Columns to search against when the global input changes. Uses TanStack's column filter on each ID. */
  searchColumnIds?: string[];
  children?: React.ReactNode;
  className?: string;
};

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Buscar…',
  searchColumnIds,
  children,
  className,
}: Props<TData>) {
  const [searchValue, setSearchValue] = React.useState('');
  const isFiltered = table.getState().columnFilters.length > 0 || searchValue.length > 0;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (searchColumnIds && searchColumnIds.length > 0) {
      for (const id of searchColumnIds) {
        table.getColumn(id)?.setFilterValue(value);
      }
    } else {
      // Apply to the global filter if no columns specified.
      table.setGlobalFilter(value);
    }
  };

  const handleReset = () => {
    setSearchValue('');
    table.resetColumnFilters();
    table.setGlobalFilter('');
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-[260px] pl-9"
          />
        </div>
        {children}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Limpiar
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
