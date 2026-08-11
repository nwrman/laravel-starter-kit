import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from './breadcrumbs';

const deepTrail = [
  { title: 'Inicio', href: '/' },
  { title: 'Proyectos', href: '/projects' },
  { title: 'Crear Proyecto', href: '/projects/create' },
];

/** Both trails render at once; CSS picks one per breakpoint, which jsdom can't do. */
const mobileTrail = (container: HTMLElement) =>
  within(container.querySelector('nav.md\\:hidden') as HTMLElement);
const desktopTrail = (container: HTMLElement) =>
  within(container.querySelector('nav.hidden') as HTMLElement);

describe('Breadcrumbs', () => {
  it('renders nothing for an empty array', () => {
    const { container } = render(<Breadcrumbs breadcrumbs={[]} />);

    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders a single item as the current page', () => {
    render(<Breadcrumbs breadcrumbs={[{ title: 'Home', href: '/' }]} />);

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
  });

  it('renders the whole trail on desktop', () => {
    const { container } = render(<Breadcrumbs breadcrumbs={deepTrail} />);
    const desktop = desktopTrail(container);

    expect(desktop.getByText('Inicio')).toBeInTheDocument();
    expect(desktop.getByText('Proyectos')).toBeInTheDocument();
    expect(desktop.getByText('Crear Proyecto')).toBeInTheDocument();
  });

  it('never wraps the trail onto a second line', () => {
    // A wrapped trail overflows the fixed-height header — the original bug.
    const { container } = render(<Breadcrumbs breadcrumbs={deepTrail} />);

    for (const list of container.querySelectorAll('ol')) {
      expect(list.className).toContain('flex-nowrap');
    }
  });

  describe('on mobile', () => {
    it('collapses the middle of a deep trail behind a menu', () => {
      const { container } = render(<Breadcrumbs breadcrumbs={deepTrail} />);
      const mobile = mobileTrail(container);

      expect(mobile.getByText('Inicio')).toBeInTheDocument();
      expect(mobile.getByText('Crear Proyecto')).toBeInTheDocument();
      // The middle is reachable only through the menu.
      expect(mobile.queryByText('Proyectos')).not.toBeInTheDocument();
      expect(mobile.getByRole('button', { name: 'Ver ruta completa' })).toBeInTheDocument();
    });

    it('reveals the collapsed levels when the menu is opened', async () => {
      const user = userEvent.setup();
      const { container } = render(<Breadcrumbs breadcrumbs={deepTrail} />);

      await user.click(mobileTrail(container).getByRole('button', { name: 'Ver ruta completa' }));

      const link = await screen.findByRole('menuitem', { name: 'Proyectos' });

      expect(link).toHaveAttribute('href', '/projects');
    });

    it('omits the menu when nothing is hidden', () => {
      const { container } = render(<Breadcrumbs breadcrumbs={deepTrail.slice(0, 2)} />);
      const mobile = mobileTrail(container);

      expect(mobile.queryByRole('button', { name: 'Ver ruta completa' })).not.toBeInTheDocument();
      expect(mobile.getByText('Inicio')).toBeInTheDocument();
      expect(mobile.getByText('Proyectos')).toBeInTheDocument();
    });
  });
});
