import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppContent } from './app-content';

describe('AppContent', () => {
  it('renders children in a main element for header variant', () => {
    render(<AppContent variant="header">Content here</AppContent>);

    expect(screen.getByText('Content here')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children for sidebar variant', () => {
    render(
      <SidebarProvider>
        <AppContent variant="sidebar">Sidebar content</AppContent>
      </SidebarProvider>,
    );

    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
  });

  it('defaults to sidebar variant', () => {
    render(
      <SidebarProvider>
        <AppContent>Default content</AppContent>
      </SidebarProvider>,
    );

    expect(screen.getByText('Default content')).toBeInTheDocument();
  });
});
