import { act, render, screen } from '@testing-library/react';
import type { Passkey } from '@/types/auth';
import ManagePasskeys from './manage-passkeys';

const mockReload = vi.fn();
let mockRegisterOnSuccess: (() => void) | undefined;

vi.mock('@inertiajs/react', () => ({
  router: { reload: (...args: unknown[]) => mockReload(...args), delete: vi.fn() },
}));

vi.mock('@laravel/passkeys/react', () => ({
  usePasskeyRegister: (opts: { onSuccess?: () => void }) => {
    mockRegisterOnSuccess = opts.onSuccess;

    return { register: vi.fn(), isLoading: false, error: null, isSupported: true };
  },
}));

vi.mock('@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController', () => ({
  destroy: { url: (id: number) => `/user/passkeys/${id}` },
}));

const passkeys: Passkey[] = [
  {
    id: 1,
    name: 'My Phone',
    authenticator: null,
    created_at_diff: 'hace 1 día',
    last_used_at_diff: null,
  },
];

describe('ManagePasskeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterOnSuccess = undefined;
  });

  it('renders nothing when passkeys cannot be managed', () => {
    const { container } = render(<ManagePasskeys canManagePasskeys={false} passkeys={passkeys} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the empty state when there are no passkeys', () => {
    render(<ManagePasskeys canManagePasskeys passkeys={[]} />);

    expect(screen.getByText(/aún no tienes llaves de acceso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar llave de acceso/i })).toBeInTheDocument();
  });

  it('lists the user passkeys', () => {
    render(<ManagePasskeys canManagePasskeys passkeys={passkeys} />);

    expect(screen.getByText('My Phone')).toBeInTheDocument();
    expect(screen.getByText('Llaves de acceso')).toBeInTheDocument();
  });

  it('reloads the passkeys prop after a passkey is registered', () => {
    render(<ManagePasskeys canManagePasskeys passkeys={[]} />);

    act(() => mockRegisterOnSuccess?.());

    expect(mockReload).toHaveBeenCalledWith({ only: ['passkeys'] });
  });
});
