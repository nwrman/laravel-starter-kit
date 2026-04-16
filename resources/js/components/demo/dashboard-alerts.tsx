import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardAlert } from '@/types/demo';

const alertStyles = {
  warning: {
    border: 'border-l-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  success: {
    border: 'border-l-emerald-500',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
  },
} as const;

type Props = {
  alerts: DashboardAlert[];
};

export function DashboardAlerts({ alerts }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {alerts.map((alert) => {
          const style = alertStyles[alert.type];
          const Icon = style.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border border-l-4 p-3',
                style.border,
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', style.iconColor)} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
