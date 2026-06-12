import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Passkey } from '@/types/auth';
import PasskeyItem from './passkey-item';

const mockDelete = vi.fn();

vi.mock('@inertiajs/react', () => ({
  router: { delete: (...args: unknown[]) => mockDelete(...args) },
}));

vi.mock('@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController', () => ({
  destroy: { url: (id: number) => `/user/passkeys/${id}` },
}));

const passkey: Passkey = {
  id: 7,
  name: 'MacBook Pro',
  authenticator: 'iCloud Keychain',
  created_at_diff: 'hace 2 días',
  last_used_at_diff: 'hace 1 hora',
};

describe('PasskeyItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the passkey name, authenticator and timestamps', () => {
    render(<PasskeyItem passkey={passkey} />);

    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('iCloud Keychain')).toBeInTheDocument();
    expect(screen.getByText(/hace 2 días/)).toBeInTheDocument();
    expect(screen.getByText(/hace 1 hora/)).toBeInTheDocument();
  });

  it('deletes the passkey after confirming', async () => {
    const user = userEvent.setup();
    render(<PasskeyItem passkey={passkey} />);

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /^eliminar$/i }));

    expect(mockDelete).toHaveBeenCalledWith('/user/passkeys/7', { preserveScroll: true });
  });
});
