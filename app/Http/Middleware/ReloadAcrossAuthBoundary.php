<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Turns the redirect after a sign-in or a sign-out into a full page load (docs/adr/0018).
 *
 * An Inertia visit keeps the current document, so a session that signed in from the guest
 * /login page would live inside that document, which was never sent `no-store`. After logout,
 * the browser's back/forward cache could restore it with the team page rendered. Leaving the
 * document at each auth change means every signed-in page starts in a `no-store` document,
 * and logout leaves it behind.
 */
final class ReloadAcrossAuthBoundary
{
    public function handle(Request $request, Closure $next): Response
    {
        $wasSignedIn = $request->user() !== null;

        /** @var Response $response */
        $response = $next($request);

        if (
            $request->header('X-Inertia') !== null
            && $response instanceof RedirectResponse
            && ($request->user() !== null) !== $wasSignedIn
        ) {
            return Inertia::location($response->getTargetUrl());
        }

        return $response;
    }
}
