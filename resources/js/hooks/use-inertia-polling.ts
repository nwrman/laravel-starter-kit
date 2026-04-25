import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Polls the current Inertia page by reloading the listed props every `intervalMs`.
 * Pauses while the tab is hidden and resumes on visibility change.
 *
 * When `enabled` is false the interval is not scheduled, but a one-shot refetch
 * still runs on refocus so the page catches up with changes made in another tab.
 */
export function useInertiaPolling(only: string[], intervalMs = 5_000, enabled = true) {
  const onlyKey = only.join(',');

  useEffect(() => {
    const keys = onlyKey.split(',');
    let timer: ReturnType<typeof setInterval> | null = null;

    const reload = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      router.reload({ only: keys });
    };

    const start = () => {
      if (!enabled || timer !== null) {
        return;
      }

      timer = setInterval(reload, intervalMs);
    };

    const stop = () => {
      if (timer === null) {
        return;
      }

      clearInterval(timer);
      timer = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reload();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') {
      start();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [onlyKey, intervalMs, enabled]);
}
