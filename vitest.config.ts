import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// The toolkit's reporter writes frontend failures into storage/logs/test-failures.md beside
// Pest's, so `composer test` and `test:retry` read one report. It ships in the PHP vendor
// folder, which CI's frontend lane never installs: Vitest exits before any test runs when a
// reporter file is missing, so the lane runs without it.
const toolkitReporter = resolve(
  import.meta.dirname,
  'vendor/nwrman/laravel-toolkit/resources/js/vitest-reporter.mjs',
);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'resources/js'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['resources/js/**/*.test.{ts,tsx}'],
    exclude: [
      'resources/js/components/ui/**',
      'resources/js/components/demo/**',
      'resources/js/actions/**',
      'resources/js/routes/**',
      'resources/js/wayfinder/**',
      'node_modules',
      'vendor',
    ],
    setupFiles: ['resources/js/testing/setup.ts'],
    css: false,
    reporters: existsSync(toolkitReporter) ? ['default', toolkitReporter] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['resources/js/components/**', 'resources/js/hooks/**'],
      exclude: [
        'resources/js/components/ui/**',
        'resources/js/components/demo/**',
        'resources/js/actions/**',
        'resources/js/routes/**',
        'resources/js/wayfinder/**',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
