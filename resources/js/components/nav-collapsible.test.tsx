import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutDashboard } from 'lucide-react';
import { SidebarMenu, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { setPageUrl } from '@/testing/helpers';
import { NavCollapsible } from './nav-collapsible';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: vi.fn(() => false) }));

afterEach(() => {
  vi.mocked(useIsMobile).mockReturnValue(false);
});

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

  it('marks the parent active when a child URL is active', () => {
    setPageUrl('/settings/profile');

    const { container } = render(
      <SidebarProvider>
        <SidebarMenu>
          <NavCollapsible group={group} />
        </SidebarMenu>
      </SidebarProvider>,
    );

    expect(
      container.querySelector('[data-sidebar="menu-button"][data-active]'),
    ).toBeInTheDocument();
  });

  describe('when the sidebar is collapsed to icons', () => {
    const renderCollapsed = () =>
      render(
        <SidebarProvider defaultOpen={false}>
          <SidebarMenu>
            <NavCollapsible group={groupWithIcon} />
          </SidebarMenu>
        </SidebarProvider>,
      );

    it('hides child items until the flyout is opened', () => {
      setPageUrl('/settings/profile');

      renderCollapsed();

      // Even with an active child, the icon rail must not render the sub-list —
      // it is CSS-hidden there, which is the bug this branch works around.
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('reveals child links in a flyout when the trigger is activated', async () => {
      const user = userEvent.setup();
      setPageUrl('/other');

      renderCollapsed();

      await user.click(screen.getByRole('button'));

      expect(await screen.findByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });

    it('renders child items as links to their hrefs', async () => {
      const user = userEvent.setup();
      setPageUrl('/other');

      renderCollapsed();

      await user.click(screen.getByRole('button'));

      const profile = await screen.findByText('Profile');

      expect(profile.closest('a')).toHaveAttribute('href', '/settings/profile');
    });

    it('marks the current child in the flyout', async () => {
      const user = userEvent.setup();
      setPageUrl('/settings/profile');

      renderCollapsed();

      await user.click(screen.getByRole('button'));

      const profile = await screen.findByText('Profile');

      expect(profile.closest('a')).toHaveAttribute('aria-current', 'page');
    });

    it('marks the trigger active when a child route is current', () => {
      setPageUrl('/settings/profile');

      const { container } = renderCollapsed();

      expect(
        container.querySelector('[data-sidebar="menu-button"][data-active]'),
      ).toBeInTheDocument();
    });
  });

  it('keeps the inline sub-list on mobile even when the sidebar is collapsed', () => {
    // `state` tracks the desktop cookie, so on mobile it can read 'collapsed' while the
    // sidebar is really a sheet. Without the `!isMobile` guard the flyout would take
    // over there and the sheet's own sub-list would disappear.
    vi.mocked(useIsMobile).mockReturnValue(true);
    setPageUrl('/settings/profile');

    render(
      <SidebarProvider defaultOpen={false}>
        <SidebarMenu>
          <NavCollapsible group={group} />
        </SidebarMenu>
      </SidebarProvider>,
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});
