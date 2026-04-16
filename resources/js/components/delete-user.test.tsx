import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteUser } from './delete-user';

vi.mock('@/actions/App/Http/Controllers/DeleteUserController', () => ({
  default: {
    delete: () => ({ url: '/user', method: 'delete' as const }),
  },
}));

vi.mock('@inertiajs/react', () => ({
  router: {
    delete: vi.fn(),
  },
}));

describe('DeleteUser', () => {
  it('renders the card with title and description', () => {
    render(<DeleteUser />);

    const card = screen.getByTestId('delete-user-card');
    expect(
      within(card).getByText('Eliminar cuenta', { selector: '[data-slot="card-title"]' }),
    ).toBeInTheDocument();
    expect(
      within(card).getByText(/Elimina tu cuenta y todos tus datos de forma permanente/),
    ).toBeInTheDocument();
  });

  it('renders the trigger button', () => {
    render(<DeleteUser />);

    expect(screen.getByRole('button', { name: /eliminar cuenta/i })).toBeInTheDocument();
  });

  it('opens the confirmation dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteUser />);

    await user.click(screen.getByRole('button', { name: /eliminar cuenta/i }));

    expect(screen.getByText('¿Eliminar tu cuenta?')).toBeInTheDocument();
    expect(screen.getByText(/Ingresa tu contraseña para confirmar/)).toBeInTheDocument();
  });

  it('shows password field inside the dialog', async () => {
    const user = userEvent.setup();
    render(<DeleteUser />);

    await user.click(screen.getByRole('button', { name: /eliminar cuenta/i }));

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('shows cancel and submit buttons in the dialog', async () => {
    const user = userEvent.setup();
    render(<DeleteUser />);

    await user.click(screen.getByRole('button', { name: /eliminar cuenta/i }));

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /eliminar cuenta/i })).toBeInTheDocument();
  });

  it('closes the dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteUser />);

    await user.click(screen.getByRole('button', { name: /eliminar cuenta/i }));
    expect(screen.getByText('¿Eliminar tu cuenta?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByText('¿Eliminar tu cuenta?')).not.toBeInTheDocument();
  });
});
