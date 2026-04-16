import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-6 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[250px] items-end gap-2">
          {[40, 60, 50, 80, 65, 90, 75, 55, 70, 85, 60, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-muted"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
