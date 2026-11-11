import { Head, usePage } from '@inertiajs/react';
import { Banknote, CheckCircle, FolderOpen, Plus } from 'lucide-react';
import { type KpiCard, KpiRow } from '@/components/demo/kpi-row';
import { ProjectChart } from '@/components/demo/project-chart';
import { ProjectTable } from '@/components/demo/project-table';
import { create } from '@/routes/projects';
import type { BreadcrumbItem } from '@/types';
import type { ProjectMonthly, ProjectRow, KpiValue } from '@/types/demo';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inicio', href: '/dashboard' },
  { title: 'Proyectos', href: '/projects' },
];

// Panel page (docs/adr/0019): the cards, table and chart render their frames at once, and
// only the deferred figures wait for the server.
const kpiCards: KpiCard[] = [
  { key: 'active-projects', title: 'Proyectos Activos', icon: FolderOpen },
  { key: 'total-budget', title: 'Presupuesto Total', icon: Banknote },
  { key: 'completed-this-month', title: 'Completados este Mes', icon: CheckCircle },
];

type TableDataProps = {
  projectRows: ProjectRow[];
  projectMonthly: ProjectMonthly[];
};

type PageProps = {
  kpiStats?: KpiValue[];
  tableData?: TableDataProps;
  chartData?: TableDataProps;
};

import { PageHeader } from '@/components/page-header';
import { PagePrimaryAction } from '@/components/page-primary-action';

export default function ProjectsIndex() {
  const { kpiStats, tableData, chartData } = usePage<PageProps>().props;

  return (
    <>
      <Head title="Proyectos" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 max-sm:pb-24">
        <PageHeader
          title="Proyectos"
          description="Gestiona los proyectos de Acme Corp."
          actions={
            <PagePrimaryAction
              label="Nuevo Proyecto"
              href={create()}
              component="projects/create"
              icon={Plus}
            />
          }
        />

        <KpiRow
          cards={kpiCards}
          values={kpiStats}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        />

        <ProjectTable rows={tableData?.projectRows} />

        <ProjectChart data={chartData?.projectMonthly} />
      </div>
    </>
  );
}

ProjectsIndex.layout = () => ({ breadcrumbs });
