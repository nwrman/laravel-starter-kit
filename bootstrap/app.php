<?php

declare(strict_types=1);

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['sidebar_state']);

        $middleware->redirectGuestsTo(fn (): string => route('login'));

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Inertia XHR requests that hit the auth middleware must NOT follow a
        // 302 redirect to /login, because Inertia would silently render the
        // login page in place of the current SPA page. Instead, return 401 so
        // the client-side session-expired handler can intercept it and show
        // the session-expired modal.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->header('X-Inertia') === 'true') {
                return response()->noContent(401);
            }
        });
    })->create();
