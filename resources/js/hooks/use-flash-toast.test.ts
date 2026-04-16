import { router } from '@inertiajs/react';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useFlashToast } from './use-flash-toast';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@inertiajs/react', () => ({
  router: {
    on: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/unbound-method -- router is a plain mock, no `this` context
const routerOn = vi.mocked(router).on;

function simulateFlash(flash: Record<string, unknown>) {
  const handler = routerOn.mock.calls[0][1] as (event: {
    detail: { flash: Record<string, unknown> };
  }) => void;
  handler({ detail: { flash } });
}

describe('useFlashToast', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers a flash event listener on mount', () => {
    renderHook(() => useFlashToast());

    expect(routerOn).toHaveBeenCalledWith('flash', expect.any(Function));
  });

  it('calls the cleanup function on unmount', () => {
    const cleanup = vi.fn();
    routerOn.mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useFlashToast());
    unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('fires a success toast when flash contains success', () => {
    renderHook(() => useFlashToast());
    simulateFlash({ success: 'Record created' });

    expect(toast.success).toHaveBeenCalledWith('Record created', { duration: 3_000 });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('fires an error toast when flash contains error', () => {
    renderHook(() => useFlashToast());
    simulateFlash({ error: 'Something went wrong' });

    expect(toast.error).toHaveBeenCalledWith('Something went wrong', { duration: 6_000 });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('fires a warning toast when flash contains warning', () => {
    renderHook(() => useFlashToast());
    simulateFlash({ warning: 'Check your input' });

    expect(toast.warning).toHaveBeenCalledWith('Check your input', { duration: 5_000 });
  });

  it('fires an info toast when flash contains info', () => {
    renderHook(() => useFlashToast());
    simulateFlash({ info: 'FYI' });

    expect(toast.info).toHaveBeenCalledWith('FYI', { duration: 4_000 });
  });

  it('fires multiple toasts when flash contains multiple keys', () => {
    renderHook(() => useFlashToast());
    simulateFlash({ success: 'Created', warning: 'Check it' });

    expect(toast.success).toHaveBeenCalledWith('Created', { duration: 3_000 });
    expect(toast.warning).toHaveBeenCalledWith('Check it', { duration: 5_000 });
  });

  it('ignores non-string and unknown flash keys', () => {
    renderHook(() => useFlashToast());
    simulateFlash({ success: 123, unknown: 'ignored', info: null });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
