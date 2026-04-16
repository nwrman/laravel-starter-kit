import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'resources/js'),
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
