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

**Demo credentials:** `admin@example.com` with `default-dev-pass` as password or any password (anypass is enabled in development).

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

## Customizing

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
