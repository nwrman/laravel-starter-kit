import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup } from '@/types';

export function NavCollapsible({ group }: { group: NavGroup }) {
  const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
  const { state, isMobile } = useSidebar();
  const hasActiveChild = group.items.some((item) => isCurrentOrParentUrl(item.href));
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild]);

  // `state` follows the desktop cookie even on mobile, where the sidebar renders as a
  // sheet with no `data-collapsible` attribute — the inline sub-list works fine there.
  // Only the desktop icon rail needs the flyout.
  const isIconRail = state === 'collapsed' && !isMobile;

  // On the icon rail `SidebarMenuSub` is CSS-hidden (group-data-[collapsible=icon]),
  // so children need a flyout. A menu — not a hover-only popover — keeps them reachable
  // by click, hover and keyboard, and closes on Escape / click-outside.
  if (isIconRail) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            openOnHover
            render={
              <SidebarMenuButton
                isActive={hasActiveChild}
                tooltip={{ children: group.title }}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            {group.icon && <group.icon />}
            {/* Clipped by the 8-unit rail, but supplies the button's accessible name. */}
            <span>{group.title}</span>
          </DropdownMenuTrigger>
          {/* w-auto overrides the popup's default w-(--anchor-width): the anchor is the
              32px rail button, which would otherwise bound the flyout. */}
          <DropdownMenuContent side="right" align="start" className="w-auto min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuItem
                  key={item.title}
                  className="cursor-pointer aria-[current=page]:bg-foreground/10"
                  render={
                    <Link
                      href={item.href}
                      prefetch
                      aria-current={isCurrentUrl(item.href) ? 'page' : undefined}
                    />
                  }
                >
                  {item.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      render={<SidebarMenuItem />}
      className="group/collapsible"
    >
      <CollapsibleTrigger
        render={<SidebarMenuButton isActive={hasActiveChild} tooltip={{ children: group.title }} />}
      >
        {group.icon && <group.icon />}
        <span>{group.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {group.items.map((item) => (
            <SidebarMenuSubItem key={item.title}>
              <SidebarMenuSubButton
                render={<Link href={item.href} prefetch />}
                isActive={isCurrentUrl(item.href)}
              >
                <span>{item.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
