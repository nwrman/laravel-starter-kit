import { render, screen } from '@testing-library/react';
import { Send } from 'lucide-react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(
      <EmptyState
        icon={Send}
        title="No hay envíos"
        description="Configura los envíos desde el panel."
      />,
    );

    expect(screen.getByText('No hay envíos')).toBeInTheDocument();
    expect(screen.getByText('Configura los envíos desde el panel.')).toBeInTheDocument();
  });

  it('renders the action button with the correct href', () => {
    render(
      <EmptyState
        icon={Send}
        title="Empty"
        description="Description"
        action={{ label: 'Configurar', href: '/admin/campaigns/123/edit' }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Configurar' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/campaigns/123/edit');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not render an action button when action is undefined', () => {
    render(<EmptyState icon={Send} title="Empty" description="Description" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
