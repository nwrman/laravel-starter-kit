import { router } from '@inertiajs/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandMenu } from './command-menu';

describe('CommandMenu', () => {
  it('renders every record, including ones sharing an href', () => {
    render(<CommandMenu open onOpenChange={vi.fn()} />);

    // All four team members point at /team.
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rivera')).toBeInTheDocument();
    expect(screen.getByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('Miguel Torres')).toBeInTheDocument();
  });

  it('gives sibling records distinct keys', () => {
    // Records sharing an href (the four /team members) must not collide on key.
    // React only warns here rather than dropping rows, so assert on the warning.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CommandMenu open onOpenChange={vi.fn()} />);

    const duplicateKeyWarnings = consoleError.mock.calls
      .map((args) => args.join(' '))
      .filter((message) => message.includes('same key'));

    expect(duplicateKeyWarnings).toEqual([]);

    consoleError.mockRestore();
  });

  it('groups records under their headings', () => {
    render(<CommandMenu open onOpenChange={vi.fn()} />);

    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Equipo')).toBeInTheDocument();
  });

  it('navigates and closes when a record is selected', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<CommandMenu open onOpenChange={onOpenChange} />);

    await user.click(screen.getByText('Miguel Torres'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(router.visit).toHaveBeenCalledWith('/team');
  });

  it('renders nothing when closed', () => {
    render(<CommandMenu open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
