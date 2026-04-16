# Adopt patterns from the official Laravel React starter kit

## Context

This repo is a custom fork of the Laravel React starter kit. Over time, upstream
has evolved and the fork has accumulated custom features. Comparing the two:

**Upstream** (`laravel/react-starter-kit@main`, contributions flow through `laravel/maestro`):

- All auth routes are **Fortify-owned** (no `routes/auth.php`, no custom `SessionController` / `UserController`).
- Only two Fortify actions live in `app/Actions/Fortify/`: `CreateNewUser`, `ResetUserPassword`.
- Password change + 2FA live in a single `SecurityController` + `settings/security.tsx`.
- Profile lives in `ProfileController` + `settings/profile.tsx`.
- `app/Concerns/` ships two traits: `PasswordValidationRules`, `ProfileValidationRules`.
- Vite wires `babel-plugin-react-compiler`.
- Uses PHPUnit 12, npm, ESLint.

**This fork**:

- Every auth endpoint has a custom controller + custom Action + Form Request + tests.
- Password and 2FA are **split** into two pages/controllers (`UserPasswordController`, `UserTwoFactorAuthenticationController`).
- Has many things upstream doesn't: Spatie MediaLibrary profile photos, ULID users, session-expired modal (401 + 419 handling), `RecordLastLogin` listener, demo pages (dashboard, projects, team), Pest 5 + Pest Browser (Playwright), oxlint/bun/vite-plus, Larastan, Rector, Boost, MCP, toolkit preflight.
- **Form convention in this repo** (confirmed by reading `user-profile/edit.tsx`, `user-password/edit.tsx`, `delete-user.tsx`, `components/form-fields.tsx`, `hooks/use-inertia-form.ts`): settings/update forms use **TanStack Form + Zod** schemas with the local `TextField` / `PasswordField` / `SelectField` / `CheckboxField` components and the `useInertiaForm` hook, which bridges TanStack validation with Inertia submissions and maps Inertia server errors back onto TanStack's `errorMap.onServer`. Simple guest auth pages (`user/create.tsx` registration, `session/create.tsx` login) use the plain Inertia `<Form>` + `InputError` pattern with uncontrolled inputs — no TanStack, no Zod. This tiered convention (heavy forms → TanStack+Zod, lightweight auth → Inertia `<Form>`) **must be preserved**.

## Decisions (from user interview)

| Question | Decision |
|---|---|
| What to adopt from upstream | Consolidate password + 2FA into a single security page; full migration to Fortify-owned auth routes; `app/Concerns/` traits. |
| What NOT to adopt | No dark-mode / theme / appearance system. No dependency bumps. |
| What to investigate | React Compiler (decide in Phase 2 based on research — is it beneficial?). |
| What to preserve | Everything non-auth: Spatie photo, ULIDs, demo pages, session-expired modal, Pest + Pest Browser, oxlint + bun + vite-plus, Larastan, custom toolkit, TanStack Form + Zod convention for settings/update forms. |
| Slice size | Thin vertical slices, tracer bullets. Each phase must end with `composer preflight` green. |
| Preflight | `composer preflight` → `php artisan toolkit:preflight` (runs pint, rector, phpstan, unit, feature, browser, vitest, type-coverage). |
| Test strategy | **Do not re-test Fortify package behavior ourselves.** Fortify has its own test suite upstream. We only test: (a) our Fortify contract actions (`CreateNewUser`, `ResetUserPassword`) because they contain *our* business logic, (b) our view bindings render the right Inertia pages with the right props, (c) our integrations still hold (session-expired modal, `RecordLastLogin`, profile photo, ULIDs) — via Browser tests where they live. |

## Explicitly NOT adopting (kept as-is)

- Upstream's `tests/` style (PHPUnit, flat `Feature/Auth`, `Feature/Settings`) — we keep Pest + mirrored `tests/` structure.
- Upstream's `eslint` + `npm` + vanilla `vite` — we keep `vite-plus` + `oxlint` + `bun`.
- Upstream's `welcome.tsx` marketing landing — we keep `/` → `/dashboard` redirect.
- Upstream's absence of Spatie MediaLibrary — we keep profile photo upload + crop.
- Upstream's absence of ULID users — we keep ULIDs.
- Upstream's absence of session-expired modal + 401 Inertia handler — we keep ours.
- Upstream's absence of `RecordLastLogin` listener + `last_login_at` — we keep it.
- Upstream's absence of demo pages (dashboard KPIs, projects, team) — we keep them.
- **Upstream's appearance/theme system** (`HandleAppearance` middleware, `use-appearance` hook, `appearance-tabs.tsx`, `settings/appearance.tsx`) — not adopted. Dark mode is intentionally out of scope.
- **No dependency bumps.** This repo is on newer versions across the board.

## Non-negotiables (invariants that must hold after every phase)

1. `composer preflight` green.
2. All existing Browser tests still pass (or are replaced by equivalent coverage).
3. Spatie MediaLibrary profile photo upload still works (upload + crop + delete).
4. Session-expired modal still triggers on 401 XHR and 419 CSRF failures.
5. ULID primary keys retained on `users` and `sessions.user_id`.
6. `RecordLastLogin` listener still fires and updates `users.last_login_at`.
7. Demo pages (dashboard charts/KPIs, projects, team) still render.
8. 2FA rate limiter (`two-factor`: 5/min by `login.id`) still applies.
9. Login rate limiter (`login`: 5/min by email+IP) still applies.
10. No orphaned `@/actions` or `@/routes` Wayfinder imports.
11. **Form convention preserved**: TanStack Form + Zod on settings/update pages; plain Inertia `<Form>` on guest auth pages. Settings forms must keep using `TextField`/`PasswordField`/etc. from `components/form-fields.tsx` and `useInertiaForm` from `hooks/use-inertia-form.ts`.

## Risks and tradeoffs

- **Fortify-owned auth is a big surface change.** It deletes the fork's custom
  `SessionController`, `UserController` (register), `UserPasswordController`
  (create/store forgot+reset flows), `UserEmailResetNotificationController`,
  `UserEmailVerificationController`, `UserEmailVerificationNotificationController`
  — plus all their tests (Feature + Browser) and their Actions
  (`CreateUser`, `CreateUserPassword`, `CreateUserEmailResetNotification`,
  `CreateUserEmailVerificationNotification`).
- **Page naming changes.** Inertia pages move from kebab-case controller-resource
  names to `auth/login.tsx`, `auth/register.tsx`, etc. This breaks every existing
  Wayfinder import for those routes in pages and tests.
- **Route names change** to Fortify's convention. We rename the settings password
  update route to `user-password.update` per upstream to avoid collision with
  Fortify's `password.update` (reset-password confirm).
- **`CreateUser` currently called directly from `UserController@store`.** We port
  its logic (ULID handling via `HasUlids` stays automatic) into `Fortify/CreateNewUser`.
- **Email verification flow**: Fortify takes over when
  `Features::emailVerification()` is enabled. `User` must still implement
  `MustVerifyEmail`.
- **2FA + password-confirm views** rename from `user-two-factor-authentication-challenge/show`
  and `user-password-confirmation/create` to `auth/two-factor-challenge` and
  `auth/confirm-password`.
- **Settings pages** move from `user-profile/edit`, `user-password/edit`,
  `user-two-factor-authentication/show` to `settings/profile`, `settings/security`
  (password + 2FA). Route names become `profile.edit`, `profile.update`,
  `profile.destroy`, `security.edit`, `user-password.update`.
- **Wayfinder imports break** across every `.tsx` page and every `*.test.tsx`
  that references old controllers. Must regenerate `resources/js/actions/` and
  `resources/js/routes/` and fix imports.
- **Auth pages coming from upstream use the plain Inertia `<Form>` pattern.**
  This matches what the fork's existing `session/create.tsx` and `user/create.tsx`
  already do, so the port is a natural fit — we do NOT need to convert these
  to TanStack+Zod. But **`settings/security.tsx`'s password-change form is a
  settings update form** and per our convention must use TanStack+Zod (unlike
  upstream's version which uses plain Inertia `<Form>`).

## Phase plan — tracer bullets

Each phase ships end-to-end and ends with `composer preflight` green.

---

### Phase 1 — `app/Concerns/` traits (pure addition)

**Risk: very low.** No behavior change — just extract validation rules into
shared traits and switch existing requests/actions to use them.

**Scope**:

- Create `app/Concerns/PasswordValidationRules.php` (copy pattern from upstream,
  add `declare(strict_types=1)`, match this repo's style).
- Create `app/Concerns/ProfileValidationRules.php`.
- Switch these to use the traits:
  - `app/Http/Requests/CreateUserRequest.php`
  - `app/Http/Requests/UpdateUserRequest.php`
  - `app/Http/Requests/CreateUserPasswordRequest.php`
  - `app/Http/Requests/UpdateUserPasswordRequest.php`
- Switch Actions that inline validation to use the traits:
  - `app/Actions/CreateUser.php`
  - `app/Actions/UpdateUser.php`
  - `app/Actions/CreateUserPassword.php`
  - `app/Actions/UpdateUserPassword.php`

**Tests**:

- Add `tests/Unit/Concerns/PasswordValidationRulesTest.php` and
  `tests/Unit/Concerns/ProfileValidationRulesTest.php` (test on an anonymous class).
- Existing Feature + Unit tests must continue to pass unchanged (same rule set,
  no behavior change).

**Done when**: `composer preflight` green.

**Why first**: Zero coupling to later phases, bankable win, introduces patterns
Phase 4 and Phase 5 will consume.

---

### Phase 2 — React Compiler: investigate, then decide

**What the React Compiler is** (answering the user's question):

- `babel-plugin-react-compiler` is Meta's build-time compiler that analyses
  React components and their hook usage and **automatically memoizes**
  expensive computations, JSX trees, and event-handler callbacks. Think of it
  as "automatic `useMemo` / `useCallback` / `React.memo`" applied conservatively
  based on static analysis.
- It's opt-in via a Babel plugin and only wraps code that passes its safety
  checks (Rules of Hooks, stable references, no unexpected side effects). Code
  it can't prove safe is skipped — so it never silently breaks anything, but
  it also won't optimize components that violate its rules.
- Paired with `eslint-plugin-react-hooks` / rules-of-hooks linting (which this
  fork has via oxlint's `react/rules-of-hooks` rule) it surfaces violations.
- Bundled into React 19 as a stable release. Upstream Laravel starter enables
  it; so does this fork's `package.json` (listed under `dependencies`, but it
  is **not actually wired** in `vite.config.ts` — confirmed by reading the file).

**Would this benefit this starter?**

- Pro: The repo has *lots* of Inertia pages, chart-heavy demo pages
  (recharts), TanStack Table, and shadcn-derived components — exactly the
  surface where auto-memoization has the biggest impact on re-render cost.
  It's free performance with negligible bundle cost.
- Pro: The fork's `AGENTS.md` already references `react-best-practices` (Vercel
  skill) which calls out hoisting defaults, functional setState, not defining
  components in components — the compiler enforces / benefits from this same
  style.
- Pro: The fork ships with oxlint's `react/rules-of-hooks` enforcement + a
  Vitest suite, so regressions are observable.
- Con: Build time increases marginally. Some third-party components that
  violate compiler assumptions may get skipped (harmless). The compiler
  generates `$[]` cache arrays in output — readable but noisy in dev-tools.
- Con: Adds a small amount of runtime state (the memo cache) per component,
  but only for components the compiler actually optimizes.

**Verdict**: Yes, it's a net win for this starter. The cost is one line in
`vite.config.ts`. The only reason not to adopt is if we plan to stay on React 18
(we're on React 19) or if a specific library in the tree is known to break
under it (none known). **Recommend adopting.** Final decision is the user's.

**Scope (if adopted)**:

- Confirm `babel-plugin-react-compiler@^1.0.0` is in `package.json` (it is —
  currently under `dependencies`; move to `devDependencies` since it's a
  build-time Babel plugin).
- Edit `vite.config.ts`:
  ```ts
  react({
    babel: {
      plugins: ['babel-plugin-react-compiler'],
    },
  }),
  ```
- Run `bun run build` and confirm no compile errors and bundle produced.
- Run `bun run test:ui` to confirm no Vitest regressions.
- Sanity check: open the dashboard and a demo page in dev, confirm they render
  and interactive features work (filters, modals, charts).

**Scope (if rejected)**:

- Remove `babel-plugin-react-compiler` from `package.json` entirely (currently
  listed but unused — cleanup).

**Tests**: preflight + `bun run build`.

**Done when**: decision recorded in the plan + applied, `composer preflight` green.

---

### Phase 3 — Consolidate password + 2FA into `settings/security.tsx` (frontend + backend)

**Risk: medium.** Merges two pages and two controllers into one. Uses this
fork's TanStack + Zod form convention, not upstream's plain Inertia `<Form>`.
Does not touch guest auth routes yet.

**Scope (backend)**:

- Create `app/Http/Controllers/Settings/SecurityController.php` with:
  - `public static function middleware(): array` → applies `password.confirm`
    to `edit` when `Features::canManageTwoFactorAuthentication()` and
    `confirmPassword` option enabled.
  - `edit(TwoFactorAuthenticationRequest $request)` — renders
    `settings/security` with `canManageTwoFactor`, `twoFactorEnabled`,
    `requiresConfirmation` props (upstream shape).
  - `update(PasswordUpdateRequest $request, UpdateUserPassword $action)` —
    invokes the existing `UpdateUserPassword` action (preserve action),
    flashes toast, returns `back()`.
- Create `app/Http/Requests/Settings/PasswordUpdateRequest.php` using the
  `PasswordValidationRules` trait from Phase 1 (`current_password` + `password`).
  Replaces `app/Http/Requests/UpdateUserPasswordRequest.php` (deleted this phase).
- Create `app/Http/Requests/Settings/TwoFactorAuthenticationRequest.php`
  using Fortify's `InteractsWithTwoFactorState` trait. Replaces
  `app/Http/Requests/ShowUserTwoFactorAuthenticationRequest.php`.
- Update `routes/web.php`:
  - Remove `GET settings/password`, `PUT settings/password`, `GET settings/two-factor`.
  - Add `GET settings/security` (name `security.edit`) and `PUT settings/password`
    (name `user-password.update`) — both hitting `SecurityController`.
  - Keep Fortify's built-in `/user/two-factor-authentication*` routes (driven
    by the existing `twoFactorAuthentication` feature).
- Delete `app/Http/Controllers/UserPasswordController.php`'s `edit()` + `update()`
  methods. (The `create()` + `store()` reset-password half stays for Phase 4.)
- Delete `app/Http/Controllers/UserTwoFactorAuthenticationController.php`.

**Scope (frontend — following this repo's TanStack+Zod convention)**:

- Create `resources/js/pages/settings/security.tsx` using:
  - `useForm` from `@tanstack/react-form`
  - Zod schema for current password, new password, confirmation (matching
    `PasswordUpdateRequest` rules: required, `Password::default()` rules,
    confirmed).
  - `useInertiaForm` hook (maps server errors → TanStack `errorMap.onServer`).
  - `PasswordField` from `@/components/form-fields` (three times).
  - Reuse the fork's existing `two-factor-setup-modal.tsx`,
    `two-factor-recovery-codes.tsx`, `use-two-factor-auth.ts` for the 2FA half.
  - Imports via Wayfinder: `@/actions/App/Http/Controllers/Settings/SecurityController`
    and `@/routes/security` + `@/routes/two-factor`.
  - Use existing `Heading` component + Settings layout.
- Delete `resources/js/pages/user-password/edit.tsx` (settings password page).
  Leave `resources/js/pages/user-password/create.tsx` (reset) for Phase 4.
- Delete `resources/js/pages/user-two-factor-authentication/show.tsx`.
- Update `resources/js/layouts/settings/layout.tsx` nav: replace
  `password.edit` + `two-factor.show` links with a single `security.edit` link.
- Update any breadcrumb / `nav-main` references.

**Tests (frontend)**:

- `resources/js/pages/settings/security.test.tsx`:
  - Renders password form.
  - Client-side Zod validation fires (empty current_password shows error
    after touch/blur).
  - Submits to the right route.
  - 2FA enable button shows when `twoFactorEnabled: false`.
  - 2FA disable + recovery-codes render when `twoFactorEnabled: true`.

**Tests (backend)**:

- `tests/Feature/Controllers/Settings/SecurityControllerTest.php`:
  - `edit` renders the Inertia page with correct props
    (`canManageTwoFactor`, `twoFactorEnabled`, `requiresConfirmation`).
  - `edit` requires `password.confirm` when 2FA confirmPassword is on.
  - `update` validates `current_password`, validates `password` rules,
    rotates the password, flashes toast, returns back.
  - `update` respects the `throttle:6,1` middleware (1 assertion).
- Delete `tests/Feature/Controllers/UserPasswordControllerTest.php`'s
  `edit` + `update` cases (keep `create` + `store` for Phase 4).
- Delete `tests/Feature/Controllers/UserTwoFactorAuthenticationControllerTest.php`.
- Delete `tests/Unit/Actions/UpdateUserPasswordTest.php` if the action is
  wholly replaced by `SecurityController@update`; otherwise keep testing the
  action (prefer keeping — the Action still wraps the rotation).
- Update `tests/Browser/PasswordTest.php` to navigate to `/settings/security`
  instead of `/settings/password`.
- Update `tests/Browser/TwoFactorTest.php` to navigate to `/settings/security`.

**Done when**: `composer preflight` green; password update + 2FA enable/confirm/
disable/recovery codes all work end-to-end from `/settings/security`; Browser
tests pass; client-side Zod validation visible in the `security.tsx` page.

---

### Phase 4 — Migrate login, register, logout, password reset, email verification, password confirmation, 2FA challenge to Fortify-owned routes

**Risk: high.** This is the heavy lift. Must be atomic — can't half-enable
Fortify routes alongside our custom ones (route conflicts). Delivered as one
feature-branch with one preflight-green commit (internally broken into logical
steps for reviewability).

**Enable Fortify features** (`config/fortify.php`) — final state:

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

**Intentionally NOT enabled**: `updateProfileInformation` and `updatePasswords`.
Those stay with our `ProfileController` + `SecurityController` so:

- Profile update keeps Spatie photo handling + ULID-safe updates.
- Password update at `/settings/password` keeps using our `SecurityController@update`
  (named `user-password.update` — no collision with Fortify's `password.update`
  which is its reset-password endpoint).

**`app/Actions/Fortify/` (new)**:

- `CreateNewUser.php` implementing `Fortify\Contracts\CreatesNewUsers`, using
  `PasswordValidationRules` + `ProfileValidationRules` traits. Creates the User
  (ULID assigned automatically by `HasUlids`). No photo on register — photo
  is attached post-registration via profile edit (unchanged).
- `ResetUserPassword.php` implementing `Fortify\Contracts\ResetsUserPasswords`,
  using `PasswordValidationRules`. `forceFill(['password' => $input['password']])`.

**`app/Providers/FortifyServiceProvider.php`** — extend to bind views + actions:

```php
public function boot(): void
{
    $this->bootActions();
    $this->bootFortifyDefaults();
    $this->bootRateLimitingDefaults();
}

private function bootActions(): void
{
    Fortify::createUsersUsing(CreateNewUser::class);
    Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
}

private function bootFortifyDefaults(): void
{
    Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
        'canResetPassword' => Features::enabled(Features::resetPasswords()),
        'canRegister' => Features::enabled(Features::registration()),
        'status' => $request->session()->get('status'),
    ]));
    Fortify::registerView(fn () => Inertia::render('auth/register'));
    Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
        'status' => $request->session()->get('status'),
    ]));
    Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
        'email' => $request->email,
        'token' => $request->route('token'),
    ]));
    Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
        'status' => $request->session()->get('status'),
    ]));
    Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
    Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
}
```

Keep the existing `login` + `two-factor` rate limiters unchanged.

**`routes/web.php`** — delete the guest group (register, reset-password,
forgot-password, login) and the email verification block and the logout
route. All of these are now registered by Fortify. Final `web.php` contains
only:

- `permanentRedirect('/', '/dashboard')`
- `csrf-token` + `auth-check` JSON endpoints (session-expired handler requires
  these two; keep them).
- `auth` + `verified`: dashboard, projects, team
- `auth`: `user` delete, settings redirect, settings/profile (GET/PATCH + photo
  DELETE), settings/security (GET), settings/password (PUT).

**Delete (PHP)**:

- `app/Http/Controllers/SessionController.php`
- `app/Http/Controllers/UserController.php`
- `app/Http/Controllers/UserPasswordController.php` (now fully gone — the
  remaining `create` + `store` reset flow moves to Fortify)
- `app/Http/Controllers/UserEmailResetNotificationController.php`
- `app/Http/Controllers/UserEmailVerificationController.php`
- `app/Http/Controllers/UserEmailVerificationNotificationController.php`
- `app/Http/Requests/CreateSessionRequest.php`
- `app/Http/Requests/CreateUserRequest.php`
- `app/Http/Requests/CreateUserPasswordRequest.php`
- `app/Http/Requests/CreateUserEmailResetNotificationRequest.php`
- `app/Http/Requests/UpdateEmailVerificationRequest.php`
- `app/Actions/CreateUser.php` (logic ported to `Fortify/CreateNewUser`)
- `app/Actions/CreateUserPassword.php` (logic ported to `Fortify/ResetUserPassword`)
- `app/Actions/CreateUserEmailResetNotification.php` (Fortify handles it)
- `app/Actions/CreateUserEmailVerificationNotification.php` (Fortify handles it)

**Frontend page moves** — create (each uses plain Inertia `<Form>` + `InputError`
matching this fork's guest-auth convention, NOT TanStack/Zod):

- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/auth/register.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- `resources/js/pages/auth/verify-email.tsx`
- `resources/js/pages/auth/confirm-password.tsx` (password-confirm interstitial)
- `resources/js/pages/auth/two-factor-challenge.tsx`

Each page uses this fork's existing `PasswordInput`, `TextLink`, `Button`,
`InputError`, `alert-error.tsx`, `AuthLayout` — not upstream's components
verbatim. Preserve Spanish copy (`"Iniciar sesión"`, `"Crear cuenta"`, etc.)
from the existing pages.

**Frontend page deletions**:

- `resources/js/pages/session/create.tsx`
- `resources/js/pages/user/create.tsx`
- `resources/js/pages/user-password/create.tsx` (reset page)
- `resources/js/pages/user-email-reset-notification/create.tsx`
- `resources/js/pages/user-email-verification-notification/create.tsx`
- `resources/js/pages/user-two-factor-authentication-challenge/show.tsx`
- `resources/js/pages/user-password-confirmation/create.tsx`

Remove empty directories.

**Wayfinder regeneration**:

- Run vite build (or dev) to regenerate `resources/js/actions/` and
  `resources/js/routes/`. Custom controllers are gone; Fortify routes appear.
- Fix all broken imports in remaining `.tsx` files (dashboard, projects, team,
  settings pages, layouts, nav, component tests).

**Tests — delete** (these tested *our* controllers that no longer exist):

- `tests/Feature/Controllers/SessionControllerTest.php`
- `tests/Feature/Controllers/UserControllerTest.php`
- `tests/Feature/Controllers/UserPasswordControllerTest.php`
- `tests/Feature/Controllers/UserEmailResetNotificationTest.php`
- `tests/Feature/Controllers/UserEmailVerificationTest.php`
- `tests/Feature/Controllers/UserEmailVerificationNotificationControllerTest.php`
- `tests/Unit/Actions/CreateUserTest.php`
- `tests/Unit/Actions/CreateUserPasswordTest.php`
- `tests/Unit/Actions/CreateUserEmailResetNotificationTest.php`
- `tests/Unit/Actions/CreateUserEmailVerificationNotificationTest.php`

**Tests — add** (narrow, limited to our code, NOT re-testing Fortify):

- `tests/Unit/Actions/Fortify/CreateNewUserTest.php` — our Action has our
  validation rules + creates with our User model. Test: valid input creates
  user (ULID assigned, password hashed); missing name/email/password rejected;
  duplicate email rejected.
- `tests/Unit/Actions/Fortify/ResetUserPasswordTest.php` — our Action resets
  the given user's password with our password rules. Test: valid password
  rotates hash; password shorter than our rules rejected.
- `tests/Feature/Providers/FortifyServiceProviderTest.php` (or
  `tests/Feature/Auth/AuthViewsTest.php`) — **verify our view bindings only**:
  hitting the login URL renders `auth/login` component with expected props
  (`canResetPassword`, `canRegister`); same for register/forgot-password/
  reset-password/verify-email/two-factor-challenge/confirm-password. This
  prevents regressions if we accidentally break the `Fortify::loginView`
  closure — it's testing *our* wiring, not Fortify.
- `tests/Unit/Listeners/RecordLastLoginTest.php` (already exists) — keep as-is,
  confirms we still update `last_login_at` on the Login event Fortify dispatches.

**Tests — update** (preserve user-visible flow coverage via Browser tests;
Browser tests test the *app* end-to-end, not Fortify internals):

- `tests/Browser/LoginTest.php` — update URL (`/login` still) and selectors for
  new `auth/login.tsx` page. Assert login works, remember-me, wrong password,
  throttle.
- `tests/Browser/LogoutTest.php` — POST `/logout`.
- `tests/Browser/RegistrationTest.php` — `/register` page, registration works,
  validation errors render.
- `tests/Browser/ForgotPasswordTest.php` — `/forgot-password` page sends email.
- `tests/Browser/EmailVerificationTest.php` — `/verify-email` prompt, resend,
  signed link.
- `tests/Browser/TwoFactorTest.php` — unchanged flow, but new pages.
- Existing `tests/Browser/PasswordTest.php` + `ProfileTest.php` already
  updated in Phase 3; leave alone.
- `tests/Feature/AuthCheckRouteTest.php`, `tests/Feature/CsrfTokenRouteTest.php`,
  `tests/Feature/ExceptionHandlingTest.php`, `tests/Feature/ErrorPageTest.php`
  — confirm still green (no changes expected; session-expired flow untouched).

**Test path note**: New backend tests for Fortify actions live at
`tests/Unit/Actions/Fortify/` (mirrors `app/Actions/Fortify/`). New view-binding
test lives at `tests/Feature/Providers/FortifyServiceProviderTest.php` (mirrors
`app/Providers/FortifyServiceProvider.php`). This respects the repo's rule that
tests mirror `app/` structure.

**Verify invariants still hold** (manual + automated):

- Session-expired modal: `auth-check` + `csrf-token` endpoints still registered,
  `AuthenticationException` → 401 handler in `bootstrap/app.php` unchanged,
  419 handler in `AppServiceProvider` unchanged. Run browser test by forcing
  logout and observing modal.
- `RecordLastLogin` listener: Fortify dispatches the standard
  `Illuminate\Auth\Events\Login` event. Covered by existing Unit test.
- Profile photo upload: no change in `UserProfileController` /
  `DeleteUserPhotoController`. Browser `ProfileTest.php` covers.
- ULID users: `CreateNewUser` does not touch `$user->id`; `HasUlids` handles it.
- `last_login_at` column + migration unchanged.

**Done when**: `composer preflight` green; all Browser tests pass; manual smoke
test of register / login / logout / forgot / reset / verify email / confirm
password / 2FA enroll + challenge + disable + recovery; session-expired modal
still triggers on forced 401 XHR; profile photo upload still works.

---

## Summary table

| Phase | Scope | Risk | Files changed (approx) | Ships independently |
|---|---|---|---|---|
| 1 | `app/Concerns/` traits + refactor requests/actions | very low | 8 | yes |
| 2 | React Compiler: decide + apply (or remove dep) | very low | 2 | yes |
| 3 | Consolidate password + 2FA into `settings/security.*` with TanStack+Zod | medium | ~20 | yes |
| 4 | Full migration to Fortify-owned auth (everything else) | high | ~50 | yes (big, feature-branch) |

## Suggested execution order

1 → 2 → 3 → 4

## What this plan does NOT do

- Does not add any theme / dark-mode / appearance system.
- Does not bump dependencies.
- Does not migrate off Pest / Pest Browser / oxlint / bun / vite-plus.
- Does not remove Spatie MediaLibrary or the photo upload flow.
- Does not remove ULIDs.
- Does not remove the session-expired modal or 401/419 handling.
- Does not remove demo pages (dashboard, projects, team).
- Does not adopt upstream's `welcome.tsx` landing.
- Does not re-implement Fortify tests ourselves (we only test our actions, our
  view bindings, our integrations).
- Does not convert guest auth pages (login/register/etc.) to TanStack+Zod —
  those keep the plain Inertia `<Form>` pattern matching this fork's existing
  guest-auth convention. Only the settings/security password form uses
  TanStack+Zod (matching this fork's settings/update convention).
