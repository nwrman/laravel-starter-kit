import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dashboard } from '@/routes';
import PasskeyVerify from './passkey-verify';

const mockVerify = vi.fn();
const mockRouterVisit = vi.fn();
const mockUsePasskeyVerify = vi.fn();
let mockOnSuccess: ((response: { redirect?: string }) => void) | undefined;

vi.mock('@inertiajs/react', () => ({
  router: { visit: (...args: unknown[]) => mockRouterVisit(...args) },
}));

vi.mock('@laravel/passkeys/react', () => ({
  usePasskeyVerify: (opts: { onSuccess?: (response: { redirect?: string }) => void }) => {
    mockOnSuccess = opts.onSuccess;

    return mockUsePasskeyVerify();
  },
}));

describe('PasskeyVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSuccess = undefined;
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

  it('redirects to the response URL on success', () => {
    render(<PasskeyVerify />);

    mockOnSuccess?.({ redirect: '/projects' });

    expect(mockRouterVisit).toHaveBeenCalledWith('/projects');
  });

  it('falls back to the dashboard when no redirect is returned', () => {
    render(<PasskeyVerify />);

    mockOnSuccess?.({});

    expect(mockRouterVisit).toHaveBeenCalledWith(dashboard().url);
  });
});
