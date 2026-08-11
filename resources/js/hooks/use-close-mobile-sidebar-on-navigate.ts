import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Closes the mobile sidebar sheet whenever an Inertia visit changes the page URL.
 *
 * The layout is persistent, so a client-side visit never unmounts the sheet — without
 * this it stays open on top of the page it just navigated to. Watching the URL keeps
 * the rule in one place: it covers every link (present and future), portalled menus,
 * and programmatic `router.visit`, rather than an onClick per link.
 *
 * Uses `usePage().url` (path *and* query) rather than a pathname, so paginated
 * navigation like `/projects?page=2` → `?page=3` still closes the sheet.
 *
 * Inert on desktop: `openMobile` is already false and React bails out of a state
 * update to an identical value, which also makes the initial-mount run a no-op.
 */
export function useCloseMobileSidebarOnNavigate(): void {
  const { url } = usePage();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [url, setOpenMobile]);
}
