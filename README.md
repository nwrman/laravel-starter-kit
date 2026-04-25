# Laravel Starter Kit

A batteries-included Laravel 13 starter kit with Inertia v3, React 19, and demo patterns for building admin-style applications.

Built on top of [nunomaduro/laravel-starter-kit-inertia-react](https://github.com/nunomaduro/laravel-starter-kit-inertia-react) — Nuno Maduro's ultra-strict, type-safe foundation with 100% type coverage, PHPStan level 9, Rector, Fortify auth, and Wayfinder. This project adds production-ready patterns: deferred props with skeleton loading, TanStack React Table, Inertia v3 form components, instant navigation with prefetching, command palette search, and 100% test coverage enforcement.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13, PHP 8.5+, Fortify (headless auth) |
| Frontend | React 19, Inertia.js v3, TypeScript 6 |
| Styling | Tailwind CSS 4, Shadcn UI, Base UI |
| Routing | Wayfinder (type-safe route generation) |
| Testing | Pest, Vitest, Playwright |
| Static Analysis | PHPStan (level 9), OxLint |

## What This Adds Over the Base Starter Kit

- **Deferred props with skeletons** — Dashboard, Projects, and Team pages demonstrate `Inertia::defer()` with animated skeleton fallbacks and configurable artificial latency (`DEMO_LATENCY_*_MS` env vars)
- **TanStack React Table** — Projects and Team tables with status badges, progress bars, currency formatting, and instant navigation links with prefetching
- **Inertia v3 Form component** — Project creation form using the declarative `<Form>` render-prop pattern with `<Select>`, `<Textarea>`, and validation errors
- **Command palette** — Global ⌘K search across projects and team members
- **Quick-create dropdown** — Sidebar action button for rapid entity creation
- **Recharts integration** — Area charts, bar charts, and donut charts with the shadcn chart wrapper
- **100% test coverage** — Pest backend with `loadDeferredProps` testing, Vitest frontend with co-located component tests
- **Preflight command** — `composer preflight` runs all 4 CI gates in parallel (~50s vs ~150s sequential)
- **Telegram deploy notifications** — First-class Laravel Cloud deployment notifications (gracefully skips when unconfigured)
- **Agent-ready guidelines** — Comprehensive `.ai/` guidelines and AGENTS.md for AI-assisted development

## Demo Patterns

The starter kit includes an "Acme Corp" demo that showcases each pattern:

| Page | Patterns Demonstrated |
|------|----------------------|
| **Dashboard** | `Inertia::defer()` with named groups, stat cards, area chart, donut chart, activity feed, skeleton loading |
| **Projects > Index** | TanStack table, deferred table + chart, `<Link prefetch>` for instant navigation, stat cards |
| **Projects > Detail** | Route model binding (demo), deferred activity stats + spending chart, back navigation |
| **Projects > Create** | `<Form>` component, `<Select>`, `<Textarea>`, `<Input>`, form validation, flash messages |
| **Team** | Simpler TanStack table, department donut chart, utilization bars |

### Demo Latency

Set these env vars to simulate slow responses and observe skeleton loading:

```bash
DEMO_LATENCY_CHARTS_MS=2000
DEMO_LATENCY_FEED_MS=1500
DEMO_LATENCY_TABLE_MS=1000
DEMO_LATENCY_DETAIL_MS=800
```

## Auth Defaults

### Email verification is off by default

This starter kit **auto-verifies new users on registration**. New signups land directly on `/dashboard` instead of being redirected to an email-verification page. This is the right default for most projects — it removes mail-server setup friction from the "try it out" path.

The email verification infrastructure is still wired up:

- `Features::emailVerification()` is enabled in `config/fortify.php`
- The `User` model still implements `MustVerifyEmail`
- The `'verified'` middleware still protects `/dashboard` and friends
- When a logged-in user **changes their email** in profile settings, their verification is reset and a verification email is sent (email is identity; changing it is security-sensitive)

**To require email verification on registration**, delete one line from `app/Actions/Fortify/CreateNewUser.php`:

```diff
 return DB::transaction(fn (): User => User::query()->create([
     'name' => $input['name'],
     'email' => $input['email'],
     'password' => $input['password'],
-    'email_verified_at' => now(),
 ]));
```

New users will then be redirected to `/email/verify` after registration, and must click the link sent to their email before they can access `/dashboard`.

## Getting Started

### Prerequisites

- [Laravel Herd](https://herd.laravel.com/) (recommended) or any PHP 8.5+ environment
- Bun (package manager)
- SQLite, PostgreSQL, or MySQL
- Xdebug (for coverage reports)

### Create a New Project

```bash
composer create-project nwrman/laravel-starter-kit my-app --stability=dev
```

This automatically runs the full setup: environment configuration, key generation, database migration with seeding, and initializes a git repository with an initial commit.

### Start Developing

```bash
cd my-app
composer dev      # starts queue worker, log watcher, and Vite dev server
```

The application is automatically available at `https://my-app.test` via [Laravel Herd](https://herd.laravel.com/).

**Demo credentials:** `admin@example.com` with any password (anypass is enabled in development). To test a failed login, use `1_wrong_pass`.

## Architecture

```text
app/
├── Actions/                  # Business logic (single-responsibility classes)
├── Console/Commands/         # Artisan commands (Preflight, TestReport, DeployNotify)
├── Http/Controllers/
│   ├── DashboardController   # Dashboard with deferred props
│   ├── Project/              # Project CRUD (domain subfolder)
│   └── Team/                 # Team list (domain subfolder)
├── Models/                   # Eloquent models
├── Services/
│   └── DemoDataService       # Centralized demo data for all controllers
└── Rules/                    # Custom validation rules

resources/js/
├── components/
│   ├── demo/                 # Demo components (stat-card, charts, tables)
│   └── ui/                   # Shadcn UI primitives
├── config/
│   └── navigation.ts         # Sidebar navigation with Wayfinder routes
├── hooks/                    # Custom React hooks
├── layouts/                  # Auth + app layouts
├── pages/                    # Inertia page components
│   ├── dashboard.tsx         # Dashboard (deferred props)
│   ├── projects/             # Projects module (index, show, create)
│   └── team/                 # Team module (index)
├── types/
│   └── demo.ts               # Demo data TypeScript types
├── actions/                  # Wayfinder-generated controller functions
└── routes/                   # Wayfinder-generated named route functions
```

### Data Flow

```
DemoDataService → Controller (Inertia::defer) → React Page → Demo Components (via props)
```

All demo data flows through the backend `DemoDataService` → controller → Inertia props → React components. This demonstrates the correct production pattern where components receive data via props, not from static imports.

### Domain Folder Organization

Business modules use singular PascalCase subfolders under each layer (`Http/Controllers/Project/`, `Http/Controllers/Team/`). Auth/framework files stay at the root. Create subfolders incrementally when 3+ files accumulate. See `AGENTS.md` for full guidelines.

## Testing

### Backend (Pest)

```bash
composer test:report -- --suite=unit,feature  # Unit + feature tests with report
composer test:report -- --suite=browser       # Playwright browser tests
composer test:retry                           # Re-run only previously failed tests
```

### Frontend (Vitest)

```bash
bun run test:ui              # Run all frontend tests
bun run test:ui:watch        # Watch mode
bun run test:coverage        # With coverage thresholds
```

### Preflight (All CI Gates)

Run before pushing. Executes all 4 gates in parallel:

```bash
composer preflight                                      # All gates (~50s)
composer preflight -- --retry                           # Re-run failed gates only
composer preflight -- --gate pest-coverage --gate lint  # Specific gates
```

| Gate | What it checks |
|------|---------------|
| `pest-coverage` | 100% type coverage + 100% code coverage |
| `frontend-coverage` | Vitest with threshold enforcement |
| `lint` | Pint + Rector + oxlint + formatting |
| `types` | PHPStan (level 9) + `tsc --noEmit` |

### Sequential CI equivalent

```bash
composer test:ci
```

## Code Quality

```bash
# Auto-fix everything (Rector + Pint + OxLint + formatting)
composer lint          # Backend
bun run lint           # Frontend

# Dry-run (CI mode)
composer test:lint     # Backend
bun run test:lint      # Frontend
```

## Deployment (Laravel Cloud)

### Telegram Notifications

Optional deploy notifications to Telegram. Set these env vars in Laravel Cloud:

```bash
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>
TELEGRAM_MESSAGE_THREAD_ID=<optional-topic-thread-id>
```

If credentials are missing, notifications are silently skipped (no errors).

```bash
composer cloud:build    # Build commands
composer cloud:deploy   # Deploy commands
```

## Back Office

A [Filament](https://filamentphp.com/) v5 panel ships at `/admin` for staff-only tooling. It runs on the `web` guard and is gated by an `is_admin` flag on the `User` model. Users support soft-deletes — deleted users' emails are freed for re-registration and their sessions are purged.

### User management

The panel ships a full-featured `UserResource` out of the box:

- **List page**: 4 stats (Total / Admins / New this week / Active 24h), tab filter (All / Admins / Verified / Unverified), search, column toggles, copy-email
- **Create**: admin-provisioned users with an initial password (auto-verified). Share the password out-of-band; the user changes it via `/settings/security`.
- **Edit**: tabbed form (Personal / Security / Metadata). Password field is optional on edit. Toggle admin, view 2FA status (read-only — Fortify owns 2FA lifecycle).
- **Soft-delete / restore / force-delete**: trashed users cannot log in or access the panel. Their email is freed via a parking strategy so new users can register with the same address. Restore reverts the email.
- **Bulk actions**: toggle admin, delete, restore, force-delete.

### Granting admin access

```php
// Via the factory state (tests / seeders):
User::factory()->admin()->create();

// Or on an existing user:
$user->update(['is_admin' => true]);
```

### Brand colors

Primary colors live in `resources/css/app.css` and are synced into a Filament-friendly OKLCH palette via:

```bash
php artisan filament:sync-colors
```

The command reads the single `--primary` token from `app.css`, interpolates an 11-shade ladder (`50`..`950`) anchored at `500`, and writes `config/filament-colors.php`. It also extracts `--chart-1..N` and (optionally) named brand tokens. Downstream projects can extend `BRAND_NAMES` in `app/Console/Commands/SyncColorsCommand.php` to include their own `--color-<name>` tokens.

`post-install-cmd` and `post-update-cmd` run `filament:sync-colors` automatically.

### Branding the panel

- Theme: `resources/css/filament/admin/theme.css` — sets IBM Plex Sans for headings, Noto Sans for body (matching the app). Add thin brand overrides here.
- Logo: `resources/views/filament/admin/logo.blade.php` — renders the `config('app.name')` wordmark with a "Back Office" tag. Replace with an `<x-application-logo />` or SVG for a real brand.

### Adding resources

```bash
php artisan make:filament-resource Post --view --generate
```

Resources live in `app/Filament/Resources/<Domain>/` and follow the starter's domain-folder conventions (singular PascalCase). The starter ships a full `UserResource` (list + create + edit + delete/restore) demonstrating tabbed forms, stats widgets, tab filters, bulk actions, and soft-deletes. Tests in `tests/Feature/Filament/` show the Livewire assertion patterns.

### Translations

All table columns, form fields, filters, and infolist entries call `translateLabel()` automatically (see `AppServiceProvider::boot`). Labels are humanized attribute names resolved via `lang/es.json` — add new entries there for Spanish translations of resource attributes.



To build your own application on top of this starter:

1. Replace `DemoDataService` with real services/models
2. Replace demo pages in `resources/js/pages/projects/` and `resources/js/pages/team/` with your domain pages
3. Update `resources/js/config/navigation.ts` with your navigation
4. Delete `resources/js/components/demo/` once you have real components
5. Update `resources/js/types/demo.ts` with your domain types

The authentication shell, settings pages, two-factor auth, preflight command, and testing infrastructure are all production-ready and don't need changes.

## Companion Package

This starter kit includes [`nwrman/laravel-toolkit`](https://github.com/nwrman/laravel-toolkit) as a dependency. The toolkit provides Artisan commands (`preflight`, `test:report`, `test:retry`, `deploy:notify-telegram`). It is stack-agnostic and can be used independently on any Laravel project.

## Credits

- [Nuno Maduro](https://github.com/nunomaduro) — upstream [laravel-starter-kit-inertia-react](https://github.com/nunomaduro/laravel-starter-kit-inertia-react) foundation
- [Jonathan Hernandez](https://github.com/nwrman) — demo patterns, DX tooling, testing infrastructure

## License

MIT
