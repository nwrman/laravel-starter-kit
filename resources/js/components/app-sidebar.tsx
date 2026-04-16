import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavCollapsible } from '@/components/nav-collapsible';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { isNavGroup, sidebarNav } from '@/config/navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';

export function AppSidebar() {
  const { isCurrentUrl } = useCurrentUrl();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="[&_svg]:size-8 group-data-[collapsible=icon]:[&_svg]:size-8"
              render={<Link href={dashboard()} prefetch="mount" />}
            >
              <AppLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2 py-0">
          <SidebarMenu>
            {sidebarNav.map((entry) =>
              isNavGroup(entry) ? (
                <NavCollapsible key={entry.title} group={entry} />
              ) : (
                <SidebarMenuItem key={entry.title}>
                  <SidebarMenuButton
                    render={<Link href={entry.href} prefetch />}
                    isActive={isCurrentUrl(entry.href)}
                    tooltip={{ children: entry.title }}
                  >
                    {entry.icon && <entry.icon />}
                    <span>{entry.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={[]} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
