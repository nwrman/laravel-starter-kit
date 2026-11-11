import { Head, usePage } from '@inertiajs/react';
import { Activity, Building2, Users } from 'lucide-react';
import { type KpiCard, KpiRow } from '@/components/demo/kpi-row';
import { TeamChart } from '@/components/demo/team-chart';
import { TeamTable } from '@/components/demo/team-table';
import { PageHeader } from '@/components/page-header';
import type { BreadcrumbItem } from '@/types';
import type { DepartmentDistribution, KpiValue, TeamMember } from '@/types/demo';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inicio', href: '/dashboard' },
  { title: 'Equipo', href: '/team' },
];

// Panel page (docs/adr/0019): the cards, table and chart render their frames at once, and
// only the deferred figures wait for the server.
const kpiCards: KpiCard[] = [
  { key: 'members', title: 'Total Miembros', icon: Users },
  { key: 'departments', title: 'Departamentos', icon: Building2 },
  { key: 'utilization', title: 'Utilización Promedio', icon: Activity },
];

type TableDataProps = {
  teamRows: TeamMember[];
  departmentDistribution: DepartmentDistribution[];
};

type PageProps = {
  kpiStats?: KpiValue[];
  tableData?: TableDataProps;
};

export default function TeamIndex() {
  const { kpiStats, tableData } = usePage<PageProps>().props;

  return (
    <>
      <Head title="Equipo" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        <PageHeader title="Equipo" description="Miembros del equipo de Acme Corp." />

        <KpiRow
          cards={kpiCards}
          values={kpiStats}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <TeamTable rows={tableData?.teamRows} />
          </div>
          <TeamChart departments={tableData?.departmentDistribution} />
        </div>
      </div>
    </>
  );
}

TeamIndex.layout = () => ({ breadcrumbs });
