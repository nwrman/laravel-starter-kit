import type { ResolvedComponent } from '@inertiajs/react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { initSessionExpiredHandler } from '@/lib/session-expired-handler';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent<ResolvedComponent>(
      `./pages/${name}.tsx`,
      import.meta.glob<ResolvedComponent>('./pages/**/*.tsx'),
    ),
  layout: () => AppLayout,
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <StrictMode>
        <ErrorBoundary>
          <TooltipProvider delay={0}>
            <App {...props} />
          </TooltipProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});

// Initialize global 419 session expired handler
initSessionExpiredHandler();
