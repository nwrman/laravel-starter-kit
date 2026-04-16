import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavFooter } from './nav-footer';

describe('NavFooter', () => {
  it('renders items as external links', () => {
    render(
      <SidebarProvider>
        <NavFooter items={[{ title: 'Documentation', href: 'https://docs.example.com' }]} />
      </SidebarProvider>,
    );

    expect(screen.getByText('Documentation')).toBeInTheDocument();
    const link = screen.getByText('Documentation').closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders empty when no items', () => {
    const { container } = render(
      <SidebarProvider>
        <NavFooter items={[]} />
      </SidebarProvider>,
    );

    expect(container.querySelectorAll('[data-sidebar="menu-item"]')).toHaveLength(0);
  });

  it('renders an icon when provided', () => {
    const { container } = render(
      <SidebarProvider>
        <NavFooter items={[{ title: 'Docs', href: '/docs', icon: FileText }]} />
      </SidebarProvider>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders no icon when not provided', () => {
    const { container } = render(
      <SidebarProvider>
        <NavFooter items={[{ title: 'Docs', href: '/docs' }]} />
      </SidebarProvider>,
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
