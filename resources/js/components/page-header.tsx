import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageHeaderProps = {
  title: string;
  description?: string;
  /** Renders a labelled back link on its own row above the title. */
  backHref?: string;
  backLabel?: string;
  /** Rendered beside the title — a status badge, a count, etc. */
  badge?: ReactNode;
  /** Primary page actions. Full-width below the title on mobile, right-aligned above it. */
  actions?: ReactNode;
  className?: string;
};

/**
 * The standard page header: back link, title, description and actions.
 *
 * The back link sits on its own row rather than inline, so it never floats against the
 * vertical middle of a two-line title block. Actions stack below the title on narrow
 * screens instead of being squeezed beside a wrapped description.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel ?? 'Volver'}
        </Link>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
            {badge}
          </div>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>

        {actions ? <div className="flex shrink-0 gap-2 max-sm:*:flex-1">{actions}</div> : null}
      </div>
    </div>
  );
}
