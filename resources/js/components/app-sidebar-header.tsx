import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/button';
import { CommandMenu } from '@/components/command-menu';
import { NavActions } from '@/components/nav-actions';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

function SearchPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-48 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 text-left">Buscar...</span>
      <kbd className="pointer-events-none shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-xs/4 text-[10px] font-medium text-muted-foreground after:content-['Ctrl_+_K'] in-[.macos]:after:content-['⌘K']" />
    </button>
  );
}

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/* Left: sidebar trigger + breadcrumbs */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mr-2 shrink-0 data-[orientation=vertical]:h-4"
        />
        <div className="min-w-0 truncate">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      </div>

      {/* Center: Search pill (desktop only) */}
      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <SearchPill onClick={() => setCommandOpen(true)} />
      </div>

      {/* Right: mobile icons + bell + crear */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-5" />
        </Button>
        <NavActions />
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
}
