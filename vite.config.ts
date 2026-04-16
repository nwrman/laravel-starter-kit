import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite-plus';

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
        rules: {
          'typescript/unbound-method': 'off',
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
    '*.php': 'vendor/bin/pint --parallel',
  },
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
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
});
