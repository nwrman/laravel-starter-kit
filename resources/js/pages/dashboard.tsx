import { Deferred, Head, usePage } from '@inertiajs/react';
import { Banknote, CheckCircle, FolderOpen, Users } from 'lucide-react';
import { ChartSkeleton } from '@/components/chart-skeleton';
import { DashboardAlerts } from '@/components/demo/dashboard-alerts';
import { ProjectStatusChart } from '@/components/demo/project-status-chart';
import { RecentActivity } from '@/components/demo/recent-activity';
import { RevenueChart } from '@/components/demo/revenue-chart';
import { StatCard } from '@/components/demo/stat-card';
import { StatCardSkeleton } from '@/components/stat-card-skeleton';
import { getTimeOfDayGreeting } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
  ActivityEntry,
  DashboardAlert,
  MonthlyRevenue,
  ProjectStatus,
  StatCardData,
} from '@/types/demo';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Inicio',
    href: dashboard(),
  },
];

const iconMap = {
  users: Users,
  banknote: Banknote,
  folder: FolderOpen,
  'check-circle': CheckCircle,
} as const;

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
  kpiStats: StatCardData[];
  charts?: ChartsProps;
  feed?: FeedProps;
};

export default function Dashboard() {
  const { auth, kpiStats, charts, feed } = usePage<
    { auth: { user: { name: string } } } & PageProps
  >().props;

  const greeting = getTimeOfDayGreeting(new Date().getHours());

  return (
    <>
      <Head title="Inicio" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {auth.user.name}
          </h1>
          <p className="text-muted-foreground">Resumen de la actividad en Acme Corp.</p>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Charts Row */}
        <Deferred
          data="charts"
          fallback={
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartSkeleton />
              </div>
              <ChartSkeleton />
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {charts && (
              <>
                <RevenueChart
                  monthlyRevenue={charts.monthlyRevenue}
                  revenueTotal={charts.revenueTotal}
                />
                <ProjectStatusChart
                  projectStatuses={charts.projectStatuses}
                  projectTotal={charts.projectTotal}
                />
              </>
            )}
          </div>
        </Deferred>

        {/* Alerts + Activity */}
        <Deferred
          data="feed"
          fallback={
            <div className="grid gap-4 lg:grid-cols-2">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {feed && (
              <>
                <DashboardAlerts alerts={feed.dashboardAlerts} />
                <RecentActivity items={feed.recentActivity} />
              </>
            )}
          </div>
        </Deferred>
      </div>
    </>
  );
}

Dashboard.layout = () => ({ breadcrumbs });
