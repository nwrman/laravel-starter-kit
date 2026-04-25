<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LogoutResponse;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

final class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Redirect to /login (not /) after logout to preserve pre-Fortify UX.
        $this->app->singleton(LogoutResponseContract::class, LogoutResponse::class);
    }

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

        // Deny trashed (soft-deleted) users from logging in. Without this,
        // Fortify's default query silently excludes them (user "not found"),
        // which is fine for login but causes confusing UX on password-reset.
        Fortify::authenticateUsing(function (Request $request): ?User {
            /** @var User|null $user */
            $user = User::withTrashed()
                ->where('email', $request->string(Fortify::username())->value())
                ->first();

            if ($user === null || $user->trashed()) {
                return null;
            }

            $password = $request->string('password')->value();

            // Respect imanghafoori/laravel-anypass: when the AnyPass provider
            // is active, accept any password except the configured wrong one.
            if (config('auth.providers.users.driver') === 'eloquentAnyPass') {
                /** @var string $wrongPass */
                $wrongPass = config('anypass.wrong_password', '1_wrong_pass');

                return mb_strtolower($password) === mb_strtolower($wrongPass) ? null : $user;
            }

            if (! Hash::check($password, $user->password)) {
                return null;
            }

            return $user;
        });
    }

    private function bootFortifyDefaults(): void
    {
        Fortify::loginView(function (Request $request) {
            // Preserve the session-expired flow: when the client-side handler
            // redirects to /login?redirect=<path>, store the intended URL so
            // the user is bounced back there after successful authentication.
            if ($request->has('redirect')) {
                $request->session()->put('url.intended', $request->string('redirect')->value());
            }

            return Inertia::render('auth/login', [
                'canResetPassword' => Features::enabled(Features::resetPasswords()),
                'canRegister' => Features::enabled(Features::registration()),
                'status' => $request->session()->get('status'),
            ]);
        });

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

    private function bootRateLimitingDefaults(): void
    {
        RateLimiter::for('login', function (Request $request): Limit {
            $throttleKey = Str::transliterate(Str::lower($request->string(Fortify::username())->value()).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('two-factor', fn (Request $request): Limit => Limit::perMinute(5)->by($request->session()->get('login.id')));
    }
}
