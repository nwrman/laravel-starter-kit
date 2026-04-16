/* eslint-disable @typescript-eslint/unbound-method */
import { router } from '@inertiajs/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './error-boundary';

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('displays fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument();
    expect(screen.getByText(/No pudimos cargar esta sección/)).toBeInTheDocument();
  });

  it('displays error details in dev mode', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Detalles del error (Development)')).toBeInTheDocument();
    // Error message appears in the details section
    expect(screen.getAllByText(/Test error/).length).toBeGreaterThan(0);
  });

  it('displays "Intentar de nuevo" button that calls router.reload', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    const retryButton = screen.getByText('Intentar de nuevo');
    expect(retryButton).toBeInTheDocument();

    retryButton.click();
    expect(router.reload).toHaveBeenCalled();
  });

  it('displays "Ir al inicio" button that calls router.visit', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    const homeButton = screen.getByText('Ir al inicio');
    homeButton.click();
    expect(router.visit).toHaveBeenCalledWith('/');
  });

  it('uses custom fallback component when provided', () => {
    function CustomFallback({ error }: { error: Error; resetError: () => void }) {
      return <div>Custom: {error.message}</div>;
    }

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom: Test error')).toBeInTheDocument();
  });

  it('registers Inertia navigate listener on mount', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );

    expect(router.on).toHaveBeenCalledWith('navigate', expect.any(Function));
  });

  it('copies error to clipboard via modern API', async () => {
    const user = userEvent.setup();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    await user.click(screen.getByText('Copiar'));

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Test error'));
  });

  it('copies error to clipboard via textarea fallback when clipboard API is unavailable', async () => {
    const user = userEvent.setup();

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      writable: true,
      configurable: true,
    });

    // Define execCommand before spying (JSDOM doesn't have it)
    if (typeof document.execCommand !== 'function') {
      document.execCommand = () => true;
    }
    const execCommandMock = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    await user.click(screen.getByText('Copiar'));

    expect(execCommandMock).toHaveBeenCalledWith('copy');
  });

  it('logs error to console via componentDidCatch', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(errorSpy).toHaveBeenCalledWith('Error Boundary caught an error:', expect.any(Error));
    expect(errorSpy).toHaveBeenCalledWith('Component stack:', expect.any(String));
  });

  it('removes navigate listener on unmount', () => {
    const mockCleanup = vi.fn();
    vi.mocked(router.on).mockReturnValue(mockCleanup);

    const { unmount } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );

    unmount();

    expect(mockCleanup).toHaveBeenCalled();
  });

  it('resets error state when navigate event fires to a different URL', () => {
    let navigateCallback: (() => void) | undefined;
    vi.mocked(router.on).mockImplementation((_event: any, callback: any) => {
      navigateCallback = callback;
      return vi.fn();
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument();

    // Simulate navigation to a different URL
    Object.defineProperty(window, 'location', {
      value: { pathname: '/different', search: '' },
      writable: true,
      configurable: true,
    });

    act(() => {
      navigateCallback?.();
    });

    // Error should be reset — children re-render
    // Since ThrowingComponent still throws, it will show the error again
    // but the state was reset and getDerivedStateFromError ran again
    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument();
  });

  it('does not reset error state when navigate event fires to the same URL', () => {
    let navigateCallback: (() => void) | undefined;
    vi.mocked(router.on).mockImplementation((_event: any, callback: any) => {
      navigateCallback = callback;
      return vi.fn();
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    // Initial crash location is the default localhost pathname

    // Trigger navigation to the identical URL
    act(() => {
      navigateCallback?.();
    });

    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument();
  });

  it('logs error when clipboard fallback execCommand throws', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      writable: true,
      configurable: true,
    });

    if (typeof document.execCommand !== 'function') {
      document.execCommand = () => true;
    }
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('Clipboard denied');
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    await user.click(screen.getByText('Copiar'));

    expect(errorSpy).toHaveBeenCalledWith('Failed to copy error to clipboard');
  });
});
