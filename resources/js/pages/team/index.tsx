import { Deferred, Head, usePage } from '@inertiajs/react';
import { Activity, Building2, Users } from 'lucide-react';
import { ChartSkeleton } from '@/components/chart-skeleton';
import { StatCard } from '@/components/demo/stat-card';
import { TeamChart } from '@/components/demo/team-chart';
import { TeamTable } from '@/components/demo/team-table';
import { TableSkeleton } from '@/components/table-skeleton';
import type { BreadcrumbItem } from '@/types';
import type { DepartmentDistribution, StatCardData, TeamMember } from '@/types/demo';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inicio', href: '/dashboard' },
  { title: 'Equipo', href: '/team' },
];

const iconMap = {
  users: Users,
  building: Building2,
  activity: Activity,
} as const;

type TableDataProps = {
  teamRows: TeamMember[];
  departmentDistribution: DepartmentDistribution[];
};

type PageProps = {
  kpiStats: StatCardData[];
  tableData?: TableDataProps;
};

export default function TeamIndex() {
  const { kpiStats, tableData } = usePage<PageProps>().props;

  return (
    <>
      <Head title="Equipo" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">Miembros del equipo de Acme Corp.</p>
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

        {/* Table + Chart */}
        <Deferred
          data="tableData"
          fallback={
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TableSkeleton />
              </div>
              <ChartSkeleton />
            </div>
          }
        >
          {tableData && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TeamTable rows={tableData.teamRows} />
              </div>
              <TeamChart
                departments={tableData.departmentDistribution}
                total={tableData.departmentDistribution.reduce((sum, d) => sum + d.count, 0)}
              />
            </div>
          )}
        </Deferred>
      </div>
    </>
  );
}

TeamIndex.layout = () => ({ breadcrumbs });
