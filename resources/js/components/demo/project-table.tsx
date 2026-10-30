import { Link } from '@inertiajs/react';
import {
  DataTable,
  type DataTableColumnDef,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import type { ProjectRow } from '@/types/demo';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Activo: 'default',
  Completado: 'secondary',
  'En Espera': 'outline',
  Planificación: 'outline',
};

function formatCurrency(value: number): string {
  return `$${(value / 1_000).toFixed(0)}K`;
}

const columns: DataTableColumnDef<ProjectRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Proyecto" />,
    cell: ({ row }) => (
      <Link href={`/projects/${row.original.id}`} className="font-medium hover:underline" prefetch>
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: 'teamLead',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Líder" />,
  },
  {
    accessorKey: 'budget',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Presupuesto" />,
    cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.budget)}</span>,
  },
  {
    accessorKey: 'deadline',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha Límite" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.deadline}</span>,
  },
  {
    accessorKey: 'progress',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Progreso" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${row.original.progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{row.original.progress}%</span>
      </div>
    ),
  },
];

type Props = {
  rows: ProjectRow[];
};

export function ProjectTable({ rows }: Props) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      initialPageSize={10}
      renderToolbar={(table) => (
        <DataTableToolbar table={table} searchPlaceholder="Buscar proyectos…" />
      )}
      renderPagination={(table) => (
        <DataTablePagination table={table} pageSizeOptions={[10, 25, 50]} />
      )}
    />
  );
}
