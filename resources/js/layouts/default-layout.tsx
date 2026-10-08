import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { AppLayoutProps, User } from '@/types';

/**
 * The layout every page gets unless it declares its own. Most such pages sit behind
 * auth, but not all: the error page reaches guests too, and the shell's NavUser
 * dereferences `auth.user`, which is null for them. So guests get the bare page.
 *
 * This lives in the default rather than on each guest-reachable page for two reasons:
 * a new page without `.layout` is safe by construction, and no page imports the shell.
 * Pest's TIA maps shared components to the pages that import them; a single page
 * importing AppLayout would tell it every shell component affects only that page.
 */
export default function DefaultLayout({ children, ...props }: AppLayoutProps) {
  const user: User | null = usePage().props.auth.user;

  return user ? (
    <AppLayout {...props}>{children}</AppLayout>
  ) : (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">{children}</main>
  );
}
