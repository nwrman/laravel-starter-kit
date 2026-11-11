import { cn } from '@/lib/utils';

/**
 * The plot area alone, for a chart card whose title is already on screen while its data is
 * still loading (docs/adr/0019).
 */
export function ChartBodySkeleton({ className = 'h-[250px]' }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-2', className)} aria-hidden="true">
      {[40, 60, 50, 80, 65, 90, 75, 55, 70, 85, 60, 95].map((h, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t bg-muted"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/**
 * A donut chart's placeholder: the ring at the chart's size, and one legend line per category
 * in the legend's own grid, so the card is already its loaded height.
 */
export function ChartRingSkeleton({ legendItems }: { legendItems: number }) {
  return (
    <div aria-hidden="true">
      <div className="flex h-[250px] items-center justify-center">
        <div className="flex size-[180px] animate-pulse items-center justify-center rounded-full bg-muted">
          <div className="size-[120px] rounded-full bg-card" />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {Array.from({ length: legendItems }, (_, index) => (
          <div key={index} className="flex h-5 items-center gap-2" data-test="ring-legend-item">
            <div className="size-2.5 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
