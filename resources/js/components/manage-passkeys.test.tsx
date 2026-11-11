import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Passkey } from '@/types/auth';
import ManagePasskeys from './manage-passkeys';

const mockReload = vi.fn();
const mockDelete = vi.fn();
const mockOptimistic = vi.fn<(callback: OptimisticCallback) => { delete: typeof mockDelete }>(
  () => ({ delete: mockDelete }),
);
const mockToastError = vi.fn();
let mockRegisterOnSuccess: (() => void) | undefined;

type OptimisticCallback = (props: { passkeys: Passkey[] }) => { passkeys: Passkey[] };
type DeleteOptions = {
  preserveScroll: boolean;
  onHttpException: () => boolean | void;
  onNetworkError: () => boolean | void;
};

vi.mock('@inertiajs/react', () => ({
  router: {
    reload: (...args: unknown[]) => mockReload(...args),
    optimistic: (callback: OptimisticCallback) => mockOptimistic(callback),
  },
}));

vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => mockToastError(...args) } }));

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

const laptop: Passkey = {
  id: 2,
  name: 'Laptop',
  authenticator: null,
  created_at_diff: 'hace 2 días',
  last_used_at_diff: null,
};

async function confirmDelete(name: string) {
  const user = userEvent.setup();
  const row = screen.getByText(name).closest('div.border-b') as HTMLElement;
  await user.click(within(row).getByRole('button', { name: /eliminar/i }));
  await user.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: /^eliminar$/i }),
  );
}

function deleteOptions(): DeleteOptions {
  return mockDelete.mock.calls[0][1] as DeleteOptions;
}

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

  describe('deleting a passkey', () => {
    it('removes exactly that row from the page at once, then asks the server', async () => {
      render(<ManagePasskeys canManagePasskeys passkeys={[...passkeys, laptop]} />);

      await confirmDelete('My Phone');

      const removeRow = mockOptimistic.mock.calls[0][0];
      expect(removeRow({ passkeys: [...passkeys, laptop] })).toEqual({ passkeys: [laptop] });
      expect(mockDelete).toHaveBeenCalledWith(
        '/user/passkeys/1',
        expect.objectContaining({ preserveScroll: true }),
      );
    });

    it("reports a refusal in a toast and keeps Inertia's error screen away", async () => {
      render(<ManagePasskeys canManagePasskeys passkeys={passkeys} />);
      await confirmDelete('My Phone');

      let handled: boolean | void = undefined;
      act(() => {
        handled = deleteOptions().onHttpException();
      });

      expect(handled).toBe(false);
      expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar la llave “My Phone”.', {
        duration: 6_000,
      });
    });

    it('reports a dropped connection with what to do', async () => {
      render(<ManagePasskeys canManagePasskeys passkeys={passkeys} />);
      await confirmDelete('My Phone');

      let handled: boolean | void = undefined;
      act(() => {
        handled = deleteOptions().onNetworkError();
      });

      expect(handled).toBe(false);
      expect(mockToastError).toHaveBeenCalledWith(
        'No se pudo eliminar la llave “My Phone”. Revisa tu conexión e inténtalo de nuevo.',
        { duration: 6_000 },
      );
    });

    it('hands the focus to the next row once the deleted one is gone', async () => {
      const { rerender } = render(
        <ManagePasskeys canManagePasskeys passkeys={[...passkeys, laptop]} />,
      );
      await confirmDelete('My Phone');

      rerender(<ManagePasskeys canManagePasskeys passkeys={[laptop]} />);

      expect(document.activeElement).toBe(document.querySelector('[data-passkey-delete="2"]'));
    });

    it('hands the focus to the previous row when the deleted one was last', async () => {
      const { rerender } = render(
        <ManagePasskeys canManagePasskeys passkeys={[...passkeys, laptop]} />,
      );
      await confirmDelete('Laptop');

      rerender(<ManagePasskeys canManagePasskeys passkeys={passkeys} />);

      expect(document.activeElement).toBe(document.querySelector('[data-passkey-delete="1"]'));
    });

    it('hands the focus to "add" when the last passkey is gone', async () => {
      const { rerender } = render(<ManagePasskeys canManagePasskeys passkeys={passkeys} />);
      await confirmDelete('My Phone');

      rerender(<ManagePasskeys canManagePasskeys passkeys={[]} />);

      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: /agregar llave de acceso/i }),
      );
    });

    it('puts the focus back on the restored row after a refusal', async () => {
      const { rerender } = render(
        <ManagePasskeys canManagePasskeys passkeys={[...passkeys, laptop]} />,
      );
      await confirmDelete('My Phone');
      rerender(<ManagePasskeys canManagePasskeys passkeys={[laptop]} />);

      act(() => {
        deleteOptions().onHttpException();
      });
      rerender(<ManagePasskeys canManagePasskeys passkeys={[...passkeys, laptop]} />);

      expect(document.activeElement).toBe(document.querySelector('[data-passkey-delete="1"]'));
    });
  });
});
