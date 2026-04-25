import type { LucideIcon } from 'lucide-react';

type EmptyStateAction = {
  label: string;
  href: string;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
