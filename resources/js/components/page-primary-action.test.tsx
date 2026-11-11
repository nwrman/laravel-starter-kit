import { router } from '@inertiajs/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { PagePrimaryAction } from './page-primary-action';

// The real Link, not the suite's plain-<a> stand-in: these tests are about what the link
// does on a click and a hover (an instant visit, a prefetch).
vi.mock('@inertiajs/react', async (importOriginal) => importOriginal());

describe('PagePrimaryAction', () => {
  it('renders the label and links to the href', () => {
    render(<PagePrimaryAction label="Nuevo Proyecto" href="/projects/create" />);

    for (const link of screen.getAllByRole('link', { name: /Nuevo Proyecto/ })) {
      expect(link).toHaveAttribute('href', '/projects/create');
    }
  });

  it('renders both an inline and a floating instance', () => {
    // One is hidden per breakpoint by CSS, which jsdom cannot evaluate.
    render(<PagePrimaryAction label="Nuevo Proyecto" href="/projects/create" />);

    expect(screen.getAllByRole('link', { name: /Nuevo Proyecto/ })).toHaveLength(2);
  });

  it('hides the inline action on mobile and the floating one from sm up', () => {
    const { container } = render(
      <PagePrimaryAction label="Nuevo Proyecto" href="/projects/create" />,
    );

    expect(container.querySelector('.max-sm\\:hidden')).toBeInTheDocument();
    expect(container.querySelector('.sm\\:hidden')).toBeInTheDocument();
  });

  it('keeps the floating action clear of the home indicator', () => {
    const { container } = render(
      <PagePrimaryAction label="Nuevo Proyecto" href="/projects/create" />,
    );

    const floating = container.querySelector('.sm\\:hidden');

    expect(floating?.className).toContain('env(safe-area-inset-bottom)');
    expect(floating?.className).toContain('z-40');
  });

  it('renders an icon when given', () => {
    const { container } = render(
      <PagePrimaryAction label="Nuevo Proyecto" href="/projects/create" icon={Plus} />,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });

  it('visits the named page instantly when given one', async () => {
    const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
    render(
      <PagePrimaryAction
        label="Nuevo Proyecto"
        href="/projects/create"
        component="projects/create"
      />,
    );

    await userEvent.setup().click(screen.getAllByRole('link', { name: /Nuevo Proyecto/ })[0]);

    expect(visit).toHaveBeenCalledWith(
      '/projects/create',
      expect.objectContaining({ component: 'projects/create' }),
    );
  });

  it('prefetches the page when the pointer rests on it', async () => {
    const prefetch = vi.spyOn(router, 'prefetch').mockImplementation(() => {});
    render(<PagePrimaryAction label="Nuevo Proyecto" href="/projects/create" />);

    await userEvent.setup().hover(screen.getAllByRole('link', { name: /Nuevo Proyecto/ })[0]);

    await vi.waitFor(() => expect(prefetch).toHaveBeenCalledTimes(1));
    expect(prefetch.mock.calls[0][0]).toBe('/projects/create');
  });
});
