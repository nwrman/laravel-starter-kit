import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Error from './error';

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
}));

vi.mock('@/actions/App/Http/Controllers/DashboardController', () => ({
  default: { index: { url: () => '/dashboard' } },
}));

describe('Error page', () => {
  it('renders the correct title for 404', () => {
    render(<Error status={404} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Página no encontrada');
  });

  it('renders the correct title for 403', () => {
    render(<Error status={403} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Acceso restringido');
  });

  it('renders the correct title for 500', () => {
    render(<Error status={500} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Error del servidor');
  });

  it('renders the correct title for 503', () => {
    render(<Error status={503} />);
    expect(screen.getByRole('heading')).toHaveTextContent('En mantenimiento');
  });

  it('renders the correct description for 404', () => {
    render(<Error status={404} />);
    expect(screen.getByText('No pudimos encontrar lo que buscas.')).toBeInTheDocument();
  });

  it('renders the correct description for 500', () => {
    render(<Error status={500} />);
    expect(
      screen.getByText('Algo salió mal de nuestro lado. Ya fuimos notificados.'),
    ).toBeInTheDocument();
  });

  it('renders the correct description for 403', () => {
    render(<Error status={403} />);
    expect(screen.getByText('No tienes permiso para ver esta página.')).toBeInTheDocument();
  });

  it('renders the correct description for 503', () => {
    render(<Error status={503} />);
    expect(screen.getByText('Estamos haciendo mejoras. Vuelve pronto.')).toBeInTheDocument();
  });

  it('renders the status code as a decorative number', () => {
    render(<Error status={404} />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders the Ir al inicio button', () => {
    render(<Error status={404} />);
    expect(screen.getByRole('button', { name: 'Ir al inicio' })).toBeInTheDocument();
  });

  it('renders the Regresar button', () => {
    render(<Error status={404} />);
    expect(screen.getByRole('button', { name: /Regresar/ })).toBeInTheDocument();
  });

  it('navigates to dashboard when Ir al inicio is clicked', async () => {
    const user = userEvent.setup();
    const { router } = await import('@inertiajs/react');

    render(<Error status={404} />);
    await user.click(screen.getByRole('button', { name: 'Ir al inicio' }));

    expect(router.visit).toHaveBeenCalledWith('/dashboard');
  });
});
