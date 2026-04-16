<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

/**
 * Overrides Fortify's default logout redirect (to '/') to redirect to the
 * login route, preserving the pre-Fortify UX. Also clears Inertia history so
 * the back button does not leak authenticated-page content after logout.
 */
final readonly class LogoutResponse implements LogoutResponseContract
{
    public function toResponse(mixed $request): RedirectResponse
    {
        Inertia::clearHistory();

        return new RedirectResponse(route('login'));
    }
}
