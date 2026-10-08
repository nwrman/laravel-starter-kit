import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import DefaultLayout from '@/layouts/default-layout';
import { resolvePage } from '@/lib/resolve-page';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: resolvePage,
    layout: () => DefaultLayout,
    setup: ({ App, props }) => (
      <ErrorBoundary>
        <TooltipProvider delay={0}>
          <App {...props} />
        </TooltipProvider>
      </ErrorBoundary>
    ),
  }),
);
