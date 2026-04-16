import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebarHeader } from './app-sidebar-header';

describe('AppSidebarHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SidebarProvider>
        <AppSidebarHeader />
      </SidebarProvider>,
    );

    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <SidebarProvider>
        <AppSidebarHeader
          breadcrumbs={[
            { title: 'Home', href: '/' },
            { title: 'Settings', href: '/settings' },
          ]}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the search pill with keyboard shortcut', () => {
    render(
      <SidebarProvider>
        <AppSidebarHeader />
      </SidebarProvider>,
    );

    expect(screen.getByText('Buscar...')).toBeInTheDocument();

    const kbd = document.querySelector('kbd');
    expect(kbd).toBeInTheDocument();
  });

  it('renders the nav actions', () => {
    render(
      <SidebarProvider>
        <AppSidebarHeader />
      </SidebarProvider>,
    );

    expect(screen.getByText('Crear')).toBeInTheDocument();
  });

  it('opens command menu when search pill is clicked', async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider>
        <AppSidebarHeader />
      </SidebarProvider>,
    );

    await user.click(screen.getByText('Buscar...'));

    // The CommandMenu dialog should now be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens command menu via keyboard shortcut', async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider>
        <AppSidebarHeader />
      </SidebarProvider>,
    );

    await user.keyboard('{Meta>}k{/Meta}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
