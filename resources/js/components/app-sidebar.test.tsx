import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';

describe('AppSidebar', () => {
  it('renders without crashing', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.getByText('Laravel')).toBeInTheDocument();
  });

  it('renders the Inicio nav item', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });
});
