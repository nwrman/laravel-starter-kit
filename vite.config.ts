import { relative } from 'node:path';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite-plus';

// Rector's `withPaths()` in rector.php. A file named on the command line is processed even
// when it lies outside them (a file in lang/ is rewritten), so the pre-commit hook hands
// Rector only staged files inside these. Its `withSkip()` still holds for named files.
const RECTOR_PATHS = [
  'app/',
  'bootstrap/app.php',
  'config/',
  'database/',
  'public/',
  'routes/',
  'tests/',
];

const quote = (files: readonly string[]): string =>
  files.map((file) => JSON.stringify(file)).join(' ');

export default defineConfig({
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
    ignorePatterns: ['vite.config.ts', 'resources/js/components/ui/**'],
    rules: {
      'eslint/no-console': 'error',
      'eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          fix: { imports: 'safe-fix', variables: 'off' },
        },
      ],
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'warn',
    },
    env: {
      builtin: true,
    },
    overrides: [
      {
        files: ['**/*.test.ts', '**/*.test.tsx'],
        plugins: ['vitest'],
        rules: {
          'typescript/unbound-method': 'off',
          'vitest/expect-expect': 'error',
          'vitest/no-conditional-expect': 'error',
          'vitest/require-mock-type-parameters': 'off',
          'vitest/no-restricted-matchers': [
            'error',
            {
              toBeTruthy: 'Assert the exact value: toBe(true), toBe(<value>).',
              toBeFalsy: 'Assert the exact value: toBe(false), toBeNull(), toBe(0).',
              toBeDefined: 'Assert the exact value with toBe() or toEqual().',
              toBeGreaterThan: 'You arranged the data — assert the exact number with toBe().',
              toBeGreaterThanOrEqual:
                'You arranged the data — assert the exact number with toBe().',
              toBeLessThan: 'You arranged the data — assert the exact number with toBe().',
              toBeLessThanOrEqual: 'You arranged the data — assert the exact number with toBe().',
            },
          ],
        },
      },
    ],
  },
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    endOfLine: 'lf',
    insertFinalNewline: true,
    trailingComma: 'all',
    singleAttributePerLine: false,
    htmlWhitespaceSensitivity: 'css',
    overrides: [
      {
        files: ['**/*.yml'],
        options: {
          tabWidth: 2,
        },
      },
    ],
    sortTailwindcss: {
      functions: ['clsx', 'cn', 'cva'],
      stylesheet: 'resources/css/app.css',
    },
    sortImports: {
      groups: ['type-import', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      newlinesBetween: false,
    },
    ignorePatterns: [
      'resources/js/components/ui/*',
      'resources/views/mail/*',
      'resources/js/actions/*',
      'resources/js/routes/*',
      'resources/js/wayfinder/*',
      'package.json',
      'composer.json',
      '.ai/**',
      '.claude/**',
      '.mcp.json',
      '.oxlintrc.json',
      '*.md',
      'boost.json',
      'components.json',
      'pint.json',
      'tsconfig.json',
    ],
  },
  staged: {
    '*.{js,ts,tsx,css}': 'vp check --fix',
    '*.json,!package.json,!composer.json': 'vp check --fix',
    // One task, so Rector and Pint never write the same file at once: Rector first, then
    // Pint over its output. Both rewrite in place and the hook stages the result.
    '*.php': (files) => {
      const rector = files.filter((file) => {
        const path = relative(import.meta.dirname, file);

        return (
          !path.endsWith('.blade.php') &&
          RECTOR_PATHS.some((root) => (root.endsWith('/') ? path.startsWith(root) : path === root))
        );
      });

      return [
        ...(rector.length > 0
          ? [`vendor/bin/rector process --no-progress-bar ${quote(rector)}`]
          : []),
        `vendor/bin/pint --parallel ${quote(files)}`,
      ];
    },
  },
  plugins: [
    laravel({
      input: [
        'resources/css/app.css',
        'resources/css/filament/admin/theme.css',
        'resources/js/app.tsx',
      ],
      refresh: true,
    }),
    inertia({ ssr: false }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    wayfinder({
      patterns: ['routes/**/*.php', 'app/**/Http/Controllers/**/*.php'],
      formVariants: true,
    }),
  ],
  server: {
    watch: {
      // None of these can affect the browser bundle, and all of them churn:
      // vendor/ on every composer run, the agent directories on every rule or
      // skill edit. Watching them costs file handles and wakes HMR for nothing.
      ignored: ['**/.agents/**', '**/.ai/**', '**/.claude/**', '**/.cursor/**', '**/vendor/**'],
    },
  },
});
