import {
  DataTable,
  type DataTableColumnDef,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@/types/demo';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Activo: 'default',
  Licencia: 'outline',
};

const columns: DataTableColumnDef<TeamMember>[] = [
  {
    // The cell shows the email under the name, so search covers both.
    id: 'name',
    accessorFn: (row) => `${row.name} ${row.email}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Departamento" />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: 'utilization',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Utilización" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${row.original.utilization}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.original.utilization}%
        </span>
      </div>
    ),
  },
];

type Props = {
  rows: TeamMember[];
};

export function TeamTable({ rows }: Props) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      initialPageSize={10}
      renderToolbar={(table) => (
        <DataTableToolbar table={table} searchPlaceholder="Buscar personas…" />
      )}
      renderPagination={(table) => (
        <DataTablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      )}
    />
  );
}
