import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Props = {
  rows?: number;
};

export function TableSkeleton({ rows = 5 }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-48 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex gap-4 border-b pb-2">
            {[120, 80, 70, 90, 70, 60].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: w }} />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-1">
              {[120, 80, 70, 90, 70, 60].map((w, j) => (
                <div
                  key={j}
                  className="h-4 animate-pulse rounded bg-muted"
                  style={{ width: w, opacity: 1 - i * 0.08 }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
