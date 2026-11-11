import { router } from '@inertiajs/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { pages } from '@/lib/resolve-page';
import type { NavItem } from '@/types';
import { headerNav, homeNav, isNavGroup, sidebarNav } from './navigation';

// The props every page shares (HandleInertiaRequests::share): all an instant visit gives the
// page on its first render, before the server answers (docs/adr/0019).
const sharedProps = {
  name: 'Laravel',
  auth: { user: { id: 1, name: 'Admin User', email: 'admin@example.com' } },
  sidebarOpen: true,
};

vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
  usePage: () => ({ props: sharedProps, url: '/', component: '' }),
}));

class RecordErrors extends Component<{ onError: (error: Error) => void; children: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const navItems: NavItem[] = [
  homeNav,
  ...sidebarNav.flatMap((entry) => (isNavGroup(entry) ? entry.items : [entry])),
  ...headerNav,
];
const instantItems = navItems.filter((item) => item.component !== undefined);

const pageModule = (component: string) =>
  pages[`../pages/${component}.tsx`] as unknown as
    | (() => Promise<{ default: ComponentType }>)
    | undefined;

describe('instant nav items', () => {
  it('cover every nav item, so none is left as a plain visit', () => {
    expect(navItems.filter((item) => item.component === undefined)).toEqual([]);
  });

  it.each(instantItems.map((item) => [item.title, item.component!]))(
    '%s names a page the app resolves (%s)',
    (_title, component) => {
      expect(pageModule(component)).toBeTypeOf('function');
    },
  );

  it.each(instantItems.map((item) => [item.title, item.component!]))(
    '%s draws its page with only the shared props (%s)',
    async (_title, component) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { default: Page } = await pageModule(component)!();
      const errors: Error[] = [];

      const { container } = render(
        <RecordErrors onError={(error) => errors.push(error)}>
          <Page />
        </RecordErrors>,
      );

      expect(errors.map((error) => error.message)).toEqual([]);
      expect(container).not.toBeEmptyDOMElement();
    },
  );

  it('reach the sidebar link, which visits the page instantly', async () => {
    const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    await userEvent.setup().click(screen.getByRole('link', { name: 'Equipo' }));

    expect(visit).toHaveBeenCalledWith(
      '/team',
      expect.objectContaining({ component: 'team/index' }),
    );
  });
});
