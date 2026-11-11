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
