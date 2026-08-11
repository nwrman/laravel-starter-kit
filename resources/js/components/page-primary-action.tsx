import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/button';
import { cn } from '@/lib/utils';

export type PagePrimaryActionProps = {
  label: string;
  href: string;
  icon?: LucideIcon;
  className?: string;
};

/**
 * A page's primary call to action.
 *
 * Inline in the page header from `sm` up; below that it floats as a labelled pill in
 * the bottom-right corner, within thumb reach. Pages that use this must give their
 * container `max-sm:pb-24` so the floating pill can't cover the last row of content.
 *
 * `z-40` keeps it above page content but below dialogs and sheets. The bottom offset
 * adds the iOS home-indicator inset, which only resolves because the root view sets
 * `viewport-fit=cover`.
 */
export function PagePrimaryAction({ label, href, icon: Icon, className }: PagePrimaryActionProps) {
  const content = (
    <>
      {Icon ? <Icon className="size-4" data-icon="inline-start" /> : null}
      {label}
    </>
  );

  return (
    <>
      {/* Desktop: sits in the header's action slot. */}
      <Link href={href} className={cn('max-sm:hidden', className)}>
        <Button className="w-full">{content}</Button>
      </Link>

      {/* Mobile: floats bottom-right. */}
      <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 sm:hidden">
        <Link href={href}>
          <Button className="rounded-full shadow-lg">{content}</Button>
        </Link>
      </div>
    </>
  );
}
