<laravel-boost-guidelines>
=== .ai/app.actions rules ===

# App/Actions guidelines

- This application uses the Action pattern and prefers for much logic to live in reusable and composable Action classes.
- Actions live in `app/Actions`, they are named based on what they do, with no suffix.
- Actions will be called from many different places: jobs, commands, HTTP requests, API requests, MCP requests, and more.
- Create dedicated Action classes for business logic with a single `handle()` method.
- Inject dependencies via constructor using private properties.
- Create new actions with `php artisan make:action "{name}" --no-interaction`
- Wrap complex operations in `DB::transaction()` within actions when multiple models are involved.
- Some actions won't require dependencies via `__construct` and they can use just the `handle()` method.

<!-- Example action class -->
```php
<?php

declare(strict_types=1);

namespace App\Actions;

final readonly class CreateFavorite
{
    public function __construct(private FavoriteService $favorites)
    {
        //
    }

    public function handle(User $user, string $favorite): bool
    {
        return $this->favorites->add($user, $favorite);
    }
}
```

=== .ai/domain-folders rules ===

# Domain Folder Organization

- Organize business modules into **singular PascalCase** subfolders under each Laravel layer: `Actions/Project/`, `Models/Team/`, `Http/Controllers/Project/`, etc.
- Create subfolders **incrementally** when building each phase — not pre-emptively. Use the **3+ files threshold**: create a subfolder when a domain accumulates 3+ files in that layer.
- Auth/framework files (`User*Controller`, `CreateSessionRequest`, `CreateUserPassword`, `User.php`) stay at the **root** of each layer — they are cross-cutting plumbing, not a business domain.
- Place interfaces **next to their implementations** (e.g., `Services/Payment/PaymentGatewayInterface.php` alongside `Services/Payment/StripeGateway.php`). Do not create a separate `Contracts/` directory.
- Cross-domain types (shared enums, value objects) live in shared locations: `app/Enums/`, `app/ValueObjects/`.
- Wayfinder auto-adapts to controller namespace changes — no manual configuration needed.

<!-- Creating domain-organized files with Artisan -->
```bash

# Models

php artisan make:model Project/Project --no-interaction
php artisan make:model Project/ProjectMilestone --no-interaction

# Controllers

php artisan make:controller Project/ProjectController --resource --no-interaction

# Form Requests

php artisan make:request Project/StoreProjectRequest --no-interaction

# Actions

php artisan make:action "Project/CompleteProject" --no-interaction

# Enums (manual or via package)

# Namespace: App\Enums\Project\ProjectStatus

```

<!-- Domain folder mapping by phase -->
```text
Phase 1 → (root)     Auth plumbing: User model, session controllers
Phase 2 → Project/   Project, ProjectMilestone, ProjectStatus
Phase 3 → Team/      TeamMember, TeamRole, Department
```

=== .ai/general rules ===

# General Guidelines

- Don't include any superfluous PHP Annotations, except ones that start with `@` for typing variables.

## Package Manager

- This project uses **bun** — never use `npm`, `npx`, or `pnpm` for any commands.
- Install dependencies: `bun install`
- Run scripts: `bun run <script>`
- Add packages: `bun add <package>`
- Remove packages: `bun remove <package>`

## Linting

- This project uses **oxlint** (not ESLint), configured in `.oxlintrc.json`.
- Auto-fix lint and formatting: `bun run lint`
- Verify without making changes: `bun run test:lint`
- `resources/js/components/ui/` is excluded from linting (shadcn vendor files — overwritten on component updates).

=== .ai/react-best-practices rules ===

# React Performance Best Practices

Adapted from [Vercel's React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) for Inertia 3 + React. Next.js/RSC-specific rules have been removed. For detailed rule explanations with code examples, activate the `react-best-practices` skill in `.ai/skills/react-best-practices/`.

## Critical Priority

- **Eliminate waterfalls**: Use `Promise.all()` for independent async operations. Move `await` into branches where actually used.
- **Optimize bundle size**: Import directly from modules, avoid barrel files. Defer third-party scripts (analytics, logging) until after hydration.

## Medium Priority

- **Re-render optimization**: Don't subscribe to state only used in callbacks. Hoist default non-primitive props outside components. Derive state during render, not in effects. Use functional `setState` for stable callbacks. Never define components inside other components.
- **Rendering performance**: Use `content-visibility` for long lists. Use ternary operators instead of `&&` for conditional rendering. Prefer `useTransition` for loading states.

## Key Rules

- Use `useRef` for transient values that change frequently (e.g., mouse position).
- Use `useDeferredValue` to defer expensive renders and keep inputs responsive.
- Use `startTransition` for non-urgent state updates.
- Group CSS changes via classes or `cssText` instead of individual property mutations.
- Use `Set`/`Map` for O(1) lookups instead of array iteration.
- Use `flatMap` to map and filter in a single pass.
- Return early from functions to avoid deep nesting.

=== .ai/vitest rules ===

# Vitest Unit Testing Guidelines

- This project uses **Vitest** with `@testing-library/react` for frontend unit tests.
- Tests are co-located next to the source files they test, using the `.test.ts` or `.test.tsx` extension.
- Vitest globals (`describe`, `it`, `expect`) are enabled globally — do NOT import them manually.
- Use `@testing-library/user-event` for simulating user interactions (clicks, typing, etc.) instead of `fireEvent`.
- Use `@testing-library/jest-dom` matchers (e.g., `toBeInTheDocument()`, `toBeDisabled()`) for DOM assertions.
- Do NOT test ShadCN UI components (`resources/js/components/ui/**`), Wayfinder routes, or auto-generated action files.
- Coverage is scoped to `resources/js/components/**` and `resources/js/hooks/**` only.
- The `vitest.config.ts` is intentionally separate from `vite.config.ts` to avoid loading heavy plugins (Tailwind, Laravel, Wayfinder) during tests. Do NOT merge them.
- Run tests with `bun run test:ui` or `bun run test:ui:watch` for watch mode.
- Run coverage with `bun run test:coverage`.
- CSS is disabled in tests (`css: false`) — do NOT write assertions based on computed styles.

<!-- Example component test -->
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyButton } from './my-button';

describe('MyButton', () => {
    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<MyButton onClick={handleClick}>Click me</MyButton>);

        await user.click(screen.getByRole('button', { name: /click me/i }));

        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('renders as disabled when disabled prop is true', () => {
        render(<MyButton disabled>Submit</MyButton>);

        expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
});
```

<!-- Example hook test -->
```ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './use-counter';

describe('useCounter', () => {
    it('increments the count', () => {
        const { result } = renderHook(() => useCounter());

        act(() => {
            result.current.increment();
        });

        expect(result.current.count).toBe(1);
    });
});
```

=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.5
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- pestphp/pest (PEST) - v5
- phpunit/phpunit (PHPUNIT) - v13
- rector/rector (RECTOR) - v2
- @inertiajs/react (INERTIA_REACT) - v3
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `laravel-best-practices` — Apply this skill whenever writing, reviewing, or refactoring Laravel PHP code. This includes creating or modifying controllers, models, migrations, form requests, policies, jobs, scheduled commands, service classes, and Eloquent queries. Triggers for N+1 and query performance issues, caching strategies, authorization and security patterns, validation, error handling, queue and job configuration, route definitions, and architectural decisions. Also use for Laravel code reviews and refactoring existing Laravel code to follow best practices. Covers any task involving Laravel backend PHP code patterns.
- `wayfinder-development` — Use this skill for Laravel Wayfinder which auto-generates typed functions for Laravel controllers and routes. ALWAYS use this skill when frontend code needs to call backend routes or controller actions. Trigger when: connecting any React/Vue/Svelte/Inertia frontend to Laravel controllers, routes, building end-to-end features with both frontend and backend, wiring up forms or links to backend endpoints, fixing route-related TypeScript errors, importing from @/actions or @/routes, or running wayfinder:generate. Use Wayfinder route functions instead of hardcoded URLs. Covers: wayfinder() vite plugin, .url()/.get()/.post()/.form(), query params, route model binding, tree-shaking. Do not use for backend-only task
- `inertia-react-development` — Develops Inertia.js v3 React client-side applications. Activates when creating React pages, forms, or navigation; using <Link>, <Form>, useForm, useHttp, setLayoutProps, or router; working with deferred props, prefetching, optimistic updates, instant visits, or polling; or when user mentions React with Inertia, React pages, React forms, or React navigation.
- `tailwindcss-development` — Always invoke when the user's message includes 'tailwind' in any form. Also invoke for: building responsive grid layouts (multi-column card grids, product grids), flex/grid page structures (dashboards with sidebars, fixed topbars, mobile-toggle navs), styling UI components (cards, tables, navbars, pricing sections, forms, inputs, badges), adding dark mode variants, fixing spacing or typography, and Tailwind v3/v4 work. The core use case: writing or fixing Tailwind utility classes in HTML templates (Blade, JSX, Vue). Skip for backend PHP logic, database queries, API routes, JavaScript with no HTML/CSS component, CSS file audits, build tool configuration, and vanilla CSS.
- `fortify-development` — ACTIVATE when the user works on authentication in Laravel. This includes login, registration, password reset, email verification, two-factor authentication (2FA/TOTP/QR codes/recovery codes), profile updates, password confirmation, or any auth-related routes and controllers. Activate when the user mentions Fortify, auth, authentication, login, register, signup, forgot password, verify email, 2FA, or references app/Actions/Fortify/, CreateNewUser, UpdateUserProfileInformation, FortifyServiceProvider, config/fortify.php, or auth guards. Fortify is the frontend-agnostic authentication backend for Laravel that registers all auth routes and controllers. Also activate when building SPA or headless authentication, customizing login redirects, overriding response contracts like LoginResponse, or configuring login throttling. Do NOT activate for Laravel Passport (OAuth2 API tokens), Socialite (OAuth social login), or non-auth Laravel features.
- `create-feature-branch` — Use when starting new work that needs a feature branch. Activates when user wants to begin a new feature, fix, refactor, or any scoped work item. Also use when user mentions starting a new PRD phase.
- `finish-feature-branch` — Use when implementation is complete on a feature branch and you need to create a pull request. Activates when user says "finish", "create PR", "open pull request", "ready for review", or work on a feature branch is done.
- `land-feature-branch` — Use when a pull request has been approved and needs to be merged into main. Activates when user says "land", "merge PR", "merge pull request", "land the branch", or wants to complete the PR lifecycle and clean up.
- `react-best-practices` — React performance optimization guidelines adapted from Vercel Engineering for Inertia 3 + React apps. Activate when writing, reviewing, or refactoring React components, hooks, data fetching, bundle optimization, or performance improvements.
- `run-preflight` — Run the preflight command to verify all CI gates pass before pushing. Use when the user asks to verify everything is passing, run CI, run preflight, or check before shipping.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `bun run build`, `bun run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
- To check environment variables, read the `.env` file directly.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== herd rules ===

# Laravel Herd

- The application is served by Laravel Herd at `https?://[kebab-case-project-dir].test`. Use the `get-absolute-url` tool to generate valid URLs. Never run commands to serve the site. It is always available.
- Use the `herd` CLI to manage services, PHP versions, and sites (e.g. `herd sites`, `herd services:start <service>`, `herd php:list`). Run `herd list` to discover all available commands.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run only the tests relevant to your changes. Pick the narrowest scope possible for fast feedback:
  - **Backend PHP changes** (models, controllers, actions, migrations, etc.): `composer test:report -- --suite=unit,feature`.
  - **Frontend React/TS changes** (components, hooks, pages): `bun run test:ui` or with filter: `bunx vitest run path/to/file.test.tsx`.
  - **Full-stack flow changes** (routes + pages wired together): `composer test:report -- --suite=browser`.
- If tests fail, fix them and use `composer test:retry` to re-run only the previously failed tests.
- Do NOT run `composer test` (the full suite) unless you've made sweeping cross-cutting changes. Prefer targeted runs.
- **Test path convention**: Tests must mirror the `app/` directory structure. The test file for `app/Foo/Bar/Baz.php` lives at `tests/{Unit|Feature}/Foo/Bar/BazTest.php`. Examples:
  - `app/Actions/CreateUserPassword.php` → `tests/Unit/Actions/CreateUserPasswordTest.php`
  - `app/Http/Controllers/SessionController.php` → `tests/Feature/Controllers/SessionControllerTest.php`
  - `app/Console/Commands/TestReportCommand.php` → `tests/Feature/Console/TestReportCommandTest.php`
  - `app/Models/User.php` → `tests/Unit/Models/UserTest.php`

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `bun run build` or ask the user to run `bun run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests with failure tracking: `composer test:report -- --suite=unit,feature` (comma-separated suites: unit, feature, browser).
- Re-run only previously failed tests: `composer test:retry`.
- Frontend tests: `bun run test:ui` (Vitest).
- Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
