import { UserCancelledError } from '@laravel/passkeys';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dashboard } from '@/routes';
import PasskeyVerify from './passkey-verify';

const mockVerify = vi.fn();
const mockFullPageLoad = vi.fn();
const mockUsePasskeyVerify = vi.fn();
let mockOnSuccess: ((response: { redirect?: string }) => void) | undefined;

vi.mock('@/lib/full-page-load', () => ({
  fullPageLoad: (...args: unknown[]) => mockFullPageLoad(...args),
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
      errorInstance: null,
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
      errorInstance: null,
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

  it('shows a cancelled ceremony in Spanish, not the library message', () => {
    mockUsePasskeyVerify.mockReturnValue({
      verify: mockVerify,
      isLoading: false,
      error: 'The passkey operation was cancelled.',
      errorInstance: new UserCancelledError(),
      isSupported: true,
    });

    render(<PasskeyVerify />);

    expect(
      screen.getByText('Se canceló o se agotó el tiempo. Inténtalo de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('The passkey operation was cancelled.')).not.toBeInTheDocument();
  });

  it('redirects to the response URL on success', () => {
    render(<PasskeyVerify />);

    mockOnSuccess?.({ redirect: '/projects' });

    expect(mockFullPageLoad).toHaveBeenCalledWith('/projects');
  });

  it('falls back to the dashboard when no redirect is returned', () => {
    render(<PasskeyVerify />);

    mockOnSuccess?.({});

    expect(mockFullPageLoad).toHaveBeenCalledWith(dashboard().url);
  });
});
