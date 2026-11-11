<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Marks every response to a signed-in user `Cache-Control: no-store`, so the browser never
 * keeps an authenticated page to restore after logout. Laravel's default, `no-cache, private`,
 * lets Chrome hold the whole document in its back/forward cache: after logout, Back showed the
 * team page again, with its props in the page source. History encryption (ADR 0018) cannot
 * reach that copy; it only covers what Inertia writes to history.
 *
 * The user is read after the response is built, so a login response is covered and the
 * logout response is not.
 */
final class PreventCachingAuthenticatedResponses
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if ($request->user() !== null) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
