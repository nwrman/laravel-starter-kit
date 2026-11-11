import { Head, usePage } from '@inertiajs/react';
import { Banknote, CheckCircle, FolderOpen, Users } from 'lucide-react';
import { useState } from 'react';
import { DashboardAlerts } from '@/components/demo/dashboard-alerts';
import { type KpiCard, KpiRow } from '@/components/demo/kpi-row';
import { ProjectStatusChart } from '@/components/demo/project-status-chart';
import { RecentActivity } from '@/components/demo/recent-activity';
import { RevenueChart } from '@/components/demo/revenue-chart';
import { PageHeader } from '@/components/page-header';
import { getTimeOfDayGreeting } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
  ActivityEntry,
  DashboardAlert,
  MonthlyRevenue,
  ProjectStatus,
  KpiValue,
} from '@/types/demo';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Inicio',
    href: dashboard(),
  },
];

// Panel page (docs/adr/0019): every card renders its frame at once, and only the deferred
// figures wait for the server.
const kpiCards: KpiCard[] = [
  { key: 'revenue', title: 'Ingresos Mensuales', icon: Banknote },
  { key: 'active-projects', title: 'Proyectos Activos', icon: FolderOpen },
  { key: 'team-members', title: 'Miembros del Equipo', icon: Users },
  { key: 'completion-rate', title: 'Tasa de Completados', icon: CheckCircle },
];

type ChartsProps = {
  monthlyRevenue: MonthlyRevenue[];
  revenueTotal: number;
  projectStatuses: ProjectStatus[];
  projectTotal: number;
};

type FeedProps = {
  recentActivity: ActivityEntry[];
  dashboardAlerts: DashboardAlert[];
};

type PageProps = {
  kpiStats?: KpiValue[];
  charts?: ChartsProps;
  feed?: FeedProps;
};

export default function Dashboard() {
  const { auth, kpiStats, charts, feed } = usePage<
    { auth: { user: { name: string } } } & PageProps
  >().props;

  // Read the clock once, not on every render.
  const [greeting] = useState(() => getTimeOfDayGreeting(new Date().getHours()));

  return (
    <>
      <Head title="Inicio" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        <PageHeader
          title={`${greeting}, ${auth.user.name}`}
          description="Resumen de la actividad en Acme Corp."
        />

        <KpiRow
          cards={kpiCards}
          values={kpiStats}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueChart
            monthlyRevenue={charts?.monthlyRevenue}
            revenueTotal={charts?.revenueTotal}
          />
          <ProjectStatusChart
            projectStatuses={charts?.projectStatuses}
            projectTotal={charts?.projectTotal}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardAlerts alerts={feed?.dashboardAlerts} />
          <RecentActivity items={feed?.recentActivity} />
        </div>
      </div>
    </>
  );
}

Dashboard.layout = () => ({ breadcrumbs });
