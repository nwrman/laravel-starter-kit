import { render, screen } from '@testing-library/react';
import { LayoutDashboard } from 'lucide-react';
import { SidebarMenu, SidebarProvider } from '@/components/ui/sidebar';
import { setPageUrl } from '@/testing/helpers';
import { NavCollapsible } from './nav-collapsible';

const group = {
  title: 'Settings',
  href: '/settings',
  items: [
    { title: 'Profile', href: '/settings/profile' },
    { title: 'Security', href: '/settings/security' },
  ],
};

const groupWithIcon = {
  ...group,
  icon: LayoutDashboard,
};

describe('NavCollapsible', () => {
  it('renders the group title', () => {
    render(
      <SidebarProvider>
        <SidebarMenu>
          <NavCollapsible group={group} />
        </SidebarMenu>
      </SidebarProvider>,
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    const { container } = render(
      <SidebarProvider>
        <SidebarMenu>
          <NavCollapsible group={groupWithIcon} />
        </SidebarMenu>
      </SidebarProvider>,
    );

    // LayoutDashboard + ChevronRight — at least one svg present
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('opens automatically and shows child items when a child URL is active', () => {
    setPageUrl('/settings/profile');

    render(
      <SidebarProvider>
        <SidebarMenu>
          <NavCollapsible group={group} />
        </SidebarMenu>
      </SidebarProvider>,
    );

    // When hasActiveChild is true the collapsible opens — child items are visible
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('stays closed and hides child items when no child URL is active', () => {
    setPageUrl('/other');

    const { queryByText } = render(
      <SidebarProvider>
        <SidebarMenu>
          <NavCollapsible group={group} />
        </SidebarMenu>
      </SidebarProvider>,
    );

    expect(queryByText('Profile')).not.toBeInTheDocument();
  });
});
