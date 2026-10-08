import { router } from '@inertiajs/react';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import { Button } from '@/components/button';

type ErrorStatus = 403 | 404 | 500 | 503;

const titles: Record<ErrorStatus, string> = {
  403: 'Acceso restringido',
  404: 'Página no encontrada',
  500: 'Error del servidor',
  503: 'En mantenimiento',
};

const descriptions: Record<ErrorStatus, string> = {
  403: 'No tienes permiso para ver esta página.',
  404: 'No pudimos encontrar lo que buscas.',
  500: 'Algo salió mal de nuestro lado. Ya fuimos notificados.',
  503: 'Estamos haciendo mejoras. Vuelve pronto.',
};

export default function Error({ status }: { status: ErrorStatus }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-center">
      <div>
        <p className="text-base font-semibold text-primary">{status}</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          {titles[status]}
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
          {descriptions[status]}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button variant="secondary" onClick={() => window.history.back()}>
            <span aria-hidden="true">&larr;</span> Regresar
          </Button>
          <Button onClick={() => router.visit(DashboardController.index.url())}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
