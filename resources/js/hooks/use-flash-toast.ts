import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const durations: Record<ToastType, number> = {
  success: 3_000,
  error: 6_000,
  warning: 5_000,
  info: 4_000,
};

/**
 * Listens for Inertia v3 `flash` events and displays toast notifications.
 *
 * Uses `router.on('flash')` which fires exactly once per flash delivery,
 * avoiding duplicate toasts on partial reloads or React StrictMode remounts.
 */
export function useFlashToast() {
  useEffect(() => {
    return router.on('flash', (event) => {
      const flash = event.detail.flash as Record<string, unknown>;

      for (const [type, message] of Object.entries(flash)) {
        if (message && typeof message === 'string' && type in durations) {
          toast[type as ToastType](message, { duration: durations[type as ToastType] });
        }
      }
    });
  }, []);
}
