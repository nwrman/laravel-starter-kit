import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasskeyVerify from './passkey-verify';

const mockVerify = vi.fn();
const mockUsePasskeyVerify = vi.fn();

vi.mock('@laravel/passkeys/react', () => ({
  usePasskeyVerify: (opts: unknown) => mockUsePasskeyVerify(opts),
}));

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
}));

describe('PasskeyVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePasskeyVerify.mockReturnValue({
      verify: mockVerify,
      isLoading: false,
      error: null,
      isSupported: true,
    });
  });

  it('renders the sign-in button and divider when supported', () => {
    render(<PasskeyVerify />);

    expect(
      screen.getByRole('button', { name: /iniciar sesión con llave de acceso/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('O continúa con tu correo')).toBeInTheDocument();
  });

  it('renders nothing when WebAuthn is unsupported', () => {
    mockUsePasskeyVerify.mockReturnValue({
      verify: mockVerify,
      isLoading: false,
      error: null,
      isSupported: false,
    });

    const { container } = render(<PasskeyVerify />);

    expect(container).toBeEmptyDOMElement();
  });

  it('runs the verification ceremony when clicked', async () => {
    const user = userEvent.setup();
    render(<PasskeyVerify />);

    await user.click(screen.getByRole('button', { name: /iniciar sesión con llave de acceso/i }));

    expect(mockVerify).toHaveBeenCalledOnce();
  });

  it('surfaces an error message', () => {
    mockUsePasskeyVerify.mockReturnValue({
      verify: mockVerify,
      isLoading: false,
      error: 'No se pudo iniciar sesión',
      isSupported: true,
    });

    render(<PasskeyVerify />);

    expect(screen.getByText('No se pudo iniciar sesión')).toBeInTheDocument();
  });
});
