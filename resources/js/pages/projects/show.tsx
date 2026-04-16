import { Deferred, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Banknote, TrendingUp, Users } from 'lucide-react';
import { ProjectActivityChart } from '@/components/demo/project-activity-chart';
import { StatCard } from '@/components/demo/stat-card';
import { StatCardSkeleton } from '@/components/stat-card-skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectRow, StatCardData } from '@/types/demo';

const iconMap = {
  banknote: Banknote,
  'trending-up': TrendingUp,
  users: Users,
} as const;

type ActivityProps = {
  activityStats: StatCardData[];
  billingMonthly: { month: string; amount: number }[];
};

type PageProps = {
  project: ProjectRow;
  activity?: ActivityProps;
};

export default function ProjectShow() {
  const { project, activity } = usePage<PageProps>().props;

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    Activo: 'default',
    Completado: 'secondary',
    'En Espera': 'outline',
    Planificación: 'outline',
  };

  return (
    <>
      <Head title={project.name} />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/projects" className="mt-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={statusVariant[project.status] ?? 'outline'}>{project.status}</Badge>
            </div>
            <p className="text-muted-foreground">Líder: {project.teamLead}</p>
          </div>
        </div>

        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">Presupuesto</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  ${(project.budget / 1_000).toFixed(0)}K
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Fecha Límite</dt>
                <dd className="text-lg font-semibold tabular-nums">{project.deadline}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Progreso</dt>
                <dd className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-lg font-semibold tabular-nums">{project.progress}%</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Estado</dt>
                <dd className="text-lg font-semibold">{project.status}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Activity Stats + Chart (deferred) */}
        <Deferred
          data="activity"
          fallback={
            <div className="grid gap-4 lg:grid-cols-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          }
        >
          {activity && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {activity.activityStats.map((stat) => (
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
              <ProjectActivityChart data={activity.billingMonthly} />
            </>
          )}
        </Deferred>
      </div>
    </>
  );
}

ProjectShow.layout = (props: PageProps) => ({
  breadcrumbs: [
    { title: 'Inicio', href: '/dashboard' },
    { title: 'Proyectos', href: '/projects' },
    { title: props.project.name, href: `/projects/${props.project.id}` },
  ],
});
