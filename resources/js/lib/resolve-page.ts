import type { ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

/**
 * Every Inertia page, keyed by path. Test files are excluded: pages keep their tests
 * co-located, and `*.test.tsx` matches `**\/*.tsx`, so without the negative pattern
 * each one is compiled into the production build (with @testing-library in tow) and
 * published under public/build. Shared by app.tsx and ssr.tsx so the two cannot drift.
 */
export const pages = import.meta.glob<ResolvedComponent>([
  '../pages/**/*.tsx',
  '!../pages/**/*.test.tsx',
]);

export function resolvePage(name: string): Promise<ResolvedComponent> {
  return resolvePageComponent<ResolvedComponent>(`../pages/${name}.tsx`, pages);
}
