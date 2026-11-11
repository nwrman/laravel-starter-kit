import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'neutral';

type StatValue = {
  value: string;
  description: string;
  trend: { direction: TrendDirection; value: string };
};

type Props = {
  title: string;
  icon: LucideIcon;
  /** Undefined while it loads (a deferred prop): the title and icon show, the figures pulse. */
  stat?: StatValue;
};

const trendStyles: Record<TrendDirection, { color: string; arrow: string }> = {
  up: { color: 'text-emerald-600', arrow: '▲' },
  down: { color: 'text-red-600', arrow: '▼' },
  neutral: { color: 'text-muted-foreground', arrow: '─' },
};

export function StatCard({ title, icon: Icon, stat }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>{stat ? <StatFigures stat={stat} /> : <StatFiguresSkeleton />}</CardContent>
    </Card>
  );
}

function StatFigures({ stat }: { stat: StatValue }) {
  const { color, arrow } = trendStyles[stat.trend.direction];

  return (
    <>
      <div className="text-2xl font-bold">{stat.value}</div>
      <p className="mt-1 text-xs text-muted-foreground">
        <span className={cn('font-medium', color)}>
          {arrow} {stat.trend.value}
        </span>{' '}
        {stat.description}
      </p>
    </>
  );
}

function StatFiguresSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-1 h-4 w-36 animate-pulse rounded bg-muted" />
    </div>
  );
}
