import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { createUser, setPageProps } from '@/testing/helpers';
import { NavUser } from './nav-user';

describe('NavUser', () => {
  it('renders the user name', () => {
    setPageProps({ auth: { user: createUser({ name: 'Admin User' }) } });
    render(
      <SidebarProvider>
        <NavUser />
      </SidebarProvider>,
    );

    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('renders user initials in avatar fallback', () => {
    setPageProps({ auth: { user: createUser({ name: 'Jonathan Fernández' }) } });
    render(
      <SidebarProvider>
        <NavUser />
      </SidebarProvider>,
    );

    expect(screen.getByText('JF')).toBeInTheDocument();
  });

  it('renders when sidebar is collapsed', () => {
    setPageProps({ auth: { user: createUser({ name: 'Admin User' }) } });
    render(
      <SidebarProvider defaultOpen={false}>
        <NavUser />
      </SidebarProvider>,
    );

    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });
});
