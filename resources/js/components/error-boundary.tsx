import { router } from '@inertiajs/react';
import { AlertTriangle, Check, ClipboardCopy, Home, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  copied: boolean;
  error: Error | null;
  hasError: boolean;
  errorLocation: string | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private removeNavigateListener?: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, copied: false, errorLocation: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
      errorLocation:
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console for developers
    // eslint-disable-next-line no-console
    console.error('Error Boundary caught an error:', error);
    // eslint-disable-next-line no-console
    console.error('Component stack:', errorInfo.componentStack);
  }

  componentDidMount() {
    // Listen for Inertia navigation to reset error state
    // We explicitly check if the URL changed to prevent Inertia's
    // initial `navigate` event from immediately hiding errors that occurred during mount.
    this.removeNavigateListener = router.on('navigate', () => {
      const currentLocation =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : null;

      // If we're on the exact same URL where it crashed, don't reset automatically
      if (this.state.errorLocation === currentLocation) {
        return;
      }

      this.resetError();
    });
  }

  componentWillUnmount() {
    // Clean up event listener using the cleanup function
    this.removeNavigateListener?.();
  }

  handleCopyError = async () => {
    if (!this.state.error) return;

    const errorText = `Error: ${this.state.error.message}\n\nStack:\n${this.state.error.stack || 'No stack trace available'}`;

    const showSuccess = () => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    };

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(errorText);
        showSuccess();

        return;
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback for non-secure contexts (http://localhost)
    const textArea = document.createElement('textarea');

    textArea.value = errorText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      showSuccess();
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed to copy error to clipboard');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  handleGoHome = () => {
    // Navigate to dashboard/home
    router.visit('/');
  };

  handleReload = () => {
    // Reload the current page using Inertia
    router.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;

        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Ocurrió un error inesperado</AlertTitle>
              <AlertDescription>
                <div className="mb-4">
                  No pudimos cargar esta sección. Por favor intenta recargar la página o volver al
                  inicio.
                </div>
                {import.meta.env.DEV && this.state.error && (
                  <details
                    className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-foreground"
                    open
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-3 py-2 font-semibold transition-colors hover:bg-destructive/10">
                      <span>Detalles del error (Development)</span>
                      <Button
                        className="ml-2 h-7"
                        onClick={(e) => {
                          e.preventDefault();
                          void this.handleCopyError();
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        {this.state.copied ? (
                          <>
                            <Check className="size-3.5 text-green-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="size-3.5" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </summary>
                    <div className="space-y-2 border-t border-destructive/20 p-3">
                      <div>
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 max-h-48 overflow-auto rounded border border-destructive/20 bg-background/50 p-2 font-mono text-[10px] leading-relaxed break-words whitespace-pre-wrap">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={this.handleReload}
                    size="sm"
                    variant="outline"
                    className="bg-background text-foreground hover:bg-background/90"
                  >
                    <RotateCcw className="size-4" />
                    Intentar de nuevo
                  </Button>
                  <Button onClick={this.handleGoHome} size="sm" variant="ghost">
                    <Home className="size-4" />
                    Ir al inicio
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, copied: false, errorLocation: null });
  };
}
