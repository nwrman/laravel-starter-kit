# Passkeys (WebAuthn)

Passwordless sign-in with passkeys, layered on Fortify. When touching auth, account
deletion, or the login/security pages, keep this in mind.

- **Enabled** via `Features::passkeys(['confirmPassword' => true])` in `config/fortify.php`. Routes are registered by
  Fortify — list them with `php artisan route:list --path=passkey`. `passkey.login-options` / `passkey.login` are
  **guest**; `passkey.registration-options` / `passkey.store` / `passkey.destroy` require **auth + a confirmed password**.
- **Backend:** `App\Models\User` implements `Laravel\Fortify\Contracts\PasskeyUser` and uses `PasskeyAuthenticatable`.
  `App\Providers\FortifyServiceProvider` holds the `passkeys` rate limiter **and** `Passkeys::authorizeLoginUsing()` — the
  single chokepoint that rejects soft-deleted users on passkey login (mirrors the trashed-user block on password login).
- **Production secret:** `config/fortify.php` → `passkeys.user_handle_secret` reads `PASSKEYS_USER_HANDLE_SECRET`
  (defaulting to `APP_KEY`). Set a fixed value per environment — otherwise rotating `APP_KEY` invalidates every passkey.
- **Frontend:** `resources/js/components/passkey-verify.tsx` (the "Iniciar sesión con llave de acceso" button on the login
  page) plus `manage-passkeys.tsx` / `passkey-register.tsx` / `passkey-item.tsx` (Settings → Seguridad). They use
  `@laravel/passkeys/react` hooks for the WebAuthn ceremony and the kit's Inertia `<Form>` + Wayfinder conventions for
  everything else (delete reuses `ConfirmButton`).
- **Tests:** `tests/Feature/Auth/PasskeyTest.php` + co-located Vitest (`resources/js/components/passkey-*.test.tsx`). The
  WebAuthn ceremony itself is not unit-testable (no fake authenticator; real crypto) — test at the wiring level (route
  middleware, the login-authorization guard), not the assertion.
