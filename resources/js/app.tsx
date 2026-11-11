import { createInertiaApp } from '@inertiajs/react';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import DefaultLayout from '@/layouts/default-layout';
import { resolvePage } from '@/lib/resolve-page';
import { initSessionExpiredHandler } from '@/lib/session-expired-handler';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Browser only: the starter ships without SSR (ADR 0004). With no `setup`, createInertiaApp
// mounts the app itself and `withApp` wraps it. `resolve` stays ours because the
// @inertiajs/vite resolver's page glob has no exclude, and would build every co-located
// `*.test.tsx` into public/build.
void createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: resolvePage,
  layout: () => DefaultLayout,
  strictMode: true,
  withApp: (app) => (
    <ErrorBoundary>
      <TooltipProvider delay={0}>{app}</TooltipProvider>
    </ErrorBoundary>
  ),
  progress: {
    color: '#4B5563',
  },
});

// Initialize global 419 session expired handler
initSessionExpiredHandler();
