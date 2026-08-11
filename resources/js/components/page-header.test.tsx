import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Proyectos" />);

    expect(screen.getByRole('heading', { name: 'Proyectos' })).toBeInTheDocument();
  });

  it('renders the description when given', () => {
    render(<PageHeader title="Proyectos" description="Gestiona los proyectos." />);

    expect(screen.getByText('Gestiona los proyectos.')).toBeInTheDocument();
  });

  it('omits the description element when not given', () => {
    const { container } = render(<PageHeader title="Proyectos" />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('renders a labelled back link', () => {
    render(<PageHeader title="Crear Proyecto" backHref="/projects" backLabel="Proyectos" />);

    expect(screen.getByRole('link', { name: /Proyectos/ })).toHaveAttribute('href', '/projects');
  });

  it('falls back to a generic back label', () => {
    render(<PageHeader title="Crear Proyecto" backHref="/projects" />);

    expect(screen.getByRole('link', { name: /Volver/ })).toBeInTheDocument();
  });

  it('omits the back link when no href is given', () => {
    render(<PageHeader title="Proyectos" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders actions and a badge', () => {
    render(
      <PageHeader
        title="Proyecto Uno"
        badge={<Badge>Activo</Badge>}
        actions={<button type="button">Nuevo</button>}
      />,
    );

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
  });

  it('keeps the back link above the title rather than inline with it', () => {
    // Inline, the arrow floats against the vertical middle of a two-line block.
    const { container } = render(
      <PageHeader title="Crear Proyecto" description="Una descripción." backHref="/projects" />,
    );

    const back = screen.getByRole('link');
    const heading = screen.getByRole('heading');

    expect(back.parentElement).toBe(container.firstChild);
    expect(heading.closest('div')?.parentElement).not.toBe(back.parentElement);
  });
});
