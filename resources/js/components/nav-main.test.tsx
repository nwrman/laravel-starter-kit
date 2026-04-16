import { render, screen } from '@testing-library/react';
import { Home } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavMain } from './nav-main';

describe('NavMain', () => {
  it('renders nav items with titles', () => {
    render(
      <SidebarProvider>
        <NavMain items={[{ title: 'Dashboard', href: '/' }]} />
      </SidebarProvider>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders empty when no items', () => {
    const { container } = render(
      <SidebarProvider>
        <NavMain items={[]} />
      </SidebarProvider>,
    );

    expect(container.querySelectorAll('[data-sidebar="menu-item"]')).toHaveLength(0);
  });

  it('renders multiple items', () => {
    render(
      <SidebarProvider>
        <NavMain
          items={[
            { title: 'Home', href: '/' },
            { title: 'Settings', href: '/settings' },
          ]}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    const { container } = render(
      <SidebarProvider>
        <NavMain items={[{ title: 'Home', href: '/', icon: Home }]} />
      </SidebarProvider>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders no icon when not provided', () => {
    const { container } = render(
      <SidebarProvider>
        <NavMain items={[{ title: 'Home', href: '/' }]} />
      </SidebarProvider>,
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
