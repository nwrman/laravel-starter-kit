import { Deferred, Head, Link, usePage } from '@inertiajs/react';
import { Banknote, CheckCircle, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/button';
import { ChartSkeleton } from '@/components/chart-skeleton';
import { ProjectChart } from '@/components/demo/project-chart';
import { ProjectTable } from '@/components/demo/project-table';
import { StatCard } from '@/components/demo/stat-card';
import { TableSkeleton } from '@/components/table-skeleton';
import type { BreadcrumbItem } from '@/types';
import type { ProjectMonthly, ProjectRow, StatCardData } from '@/types/demo';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inicio', href: '/dashboard' },
  { title: 'Proyectos', href: '/projects' },
];

const iconMap = {
  folder: FolderOpen,
  banknote: Banknote,
  'check-circle': CheckCircle,
} as const;

type TableDataProps = {
  projectRows: ProjectRow[];
  projectMonthly: ProjectMonthly[];
};

type PageProps = {
  kpiStats: StatCardData[];
  tableData?: TableDataProps;
  chartData?: TableDataProps;
};

export default function ProjectsIndex() {
  const { kpiStats, tableData, chartData } = usePage<PageProps>().props;

  return (
    <>
      <Head title="Proyectos" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-muted-foreground">Gestiona los proyectos de Acme Corp.</p>
          </div>
          <Link href="/projects/create">
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiStats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              trend={stat.trend}
              icon={iconMap[stat.icon as keyof typeof iconMap]}
            />
          ))}
        </div>

        {/* Projects Table */}
        <Deferred data="tableData" fallback={<TableSkeleton />}>
          {tableData && <ProjectTable rows={tableData.projectRows} />}
        </Deferred>

        {/* Chart */}
        <Deferred data="chartData" fallback={<ChartSkeleton />}>
          {chartData && <ProjectChart data={chartData.projectMonthly} />}
        </Deferred>
      </div>
    </>
  );
}

ProjectsIndex.layout = () => ({ breadcrumbs });
