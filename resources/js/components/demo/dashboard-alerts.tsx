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
  /** Undefined while the deferred prop loads: the title shows, the list pulses. */
  alerts?: DashboardAlert[];
};

export function DashboardAlerts({ alerts }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {alerts ? (
          alerts.map((alert) => {
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
          })
        ) : (
          <AlertsSkeleton />
        )}
      </CardContent>
    </Card>
  );
}

/** Two alert tiles in the list's own shape, so the card does not change form on arrival. */
function AlertsSkeleton() {
  return (
    <>
      {[0, 1].map((index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-lg border p-3"
          aria-hidden="true"
        >
          <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
