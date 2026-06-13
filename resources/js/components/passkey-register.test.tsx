import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasskeyRegister from './passkey-register';

const mockRegister = vi.fn();
const mockUsePasskeyRegister = vi.fn();
let mockOnSuccess: (() => void) | undefined;

vi.mock('@laravel/passkeys/react', () => ({
  usePasskeyRegister: (opts: { onSuccess?: () => void }) => {
    mockOnSuccess = opts.onSuccess;

    return mockUsePasskeyRegister();
  },
}));

describe('PasskeyRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSuccess = undefined;
    mockUsePasskeyRegister.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      isSupported: true,
    });
  });

  it('shows a hint when WebAuthn is unsupported', () => {
    mockUsePasskeyRegister.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      isSupported: false,
    });

    render(<PasskeyRegister onSuccess={vi.fn()} />);

    expect(screen.getByText(/no son compatibles con este navegador/i)).toBeInTheDocument();
  });

  it('reveals the name form when "Agregar" is clicked', async () => {
    const user = userEvent.setup();
    render(<PasskeyRegister onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /agregar llave de acceso/i }));

    expect(screen.getByLabelText('Nombre de la llave')).toBeInTheDocument();
  });

  it('runs the registration ceremony with the entered name', async () => {
    const user = userEvent.setup();
    render(<PasskeyRegister onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /agregar llave de acceso/i }));

    const input = screen.getByLabelText('Nombre de la llave');
    await user.clear(input);
    await user.type(input, 'Work Laptop');
    await user.click(screen.getByRole('button', { name: /registrar llave/i }));

    expect(mockRegister).toHaveBeenCalledWith('Work Laptop');
  });

  it('hides the form again on cancel', async () => {
    const user = userEvent.setup();
    render(<PasskeyRegister onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /agregar llave de acceso/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByLabelText('Nombre de la llave')).not.toBeInTheDocument();
  });

  it('resets the form and notifies the parent after a successful registration', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<PasskeyRegister onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /agregar llave de acceso/i }));
    expect(screen.getByLabelText('Nombre de la llave')).toBeInTheDocument();

    act(() => mockOnSuccess?.());

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Nombre de la llave')).not.toBeInTheDocument();
  });

  it('submits the entered name when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<PasskeyRegister onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /agregar llave de acceso/i }));
    const input = screen.getByLabelText('Nombre de la llave');
    await user.clear(input);
    await user.type(input, 'iPhone{Enter}');

    expect(mockRegister).toHaveBeenCalledWith('iPhone');
  });
});
