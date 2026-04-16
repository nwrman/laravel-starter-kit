import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'neutral';

type Props = {
  title: string;
  value: string;
  description: string;
  trend: { direction: TrendDirection; value: string };
  icon: LucideIcon;
};

const trendStyles: Record<TrendDirection, { color: string; arrow: string }> = {
  up: { color: 'text-emerald-600', arrow: '▲' },
  down: { color: 'text-red-600', arrow: '▼' },
  neutral: { color: 'text-muted-foreground', arrow: '─' },
};

export function StatCard({ title, value, description, trend, icon: Icon }: Props) {
  const { color, arrow } = trendStyles[trend.direction];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className={cn('font-medium', color)}>
            {arrow} {trend.value}
          </span>{' '}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
