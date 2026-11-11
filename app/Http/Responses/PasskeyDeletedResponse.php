<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Laravel\Passkeys\Contracts\PasskeyDeletedResponse as PasskeyDeletedResponseContract;

/**
 * Confirms a deleted passkey with a success toast, the way every other settings change does
 * (use-flash-toast shows the flash). The package's own response only flashes a `status` that
 * no page reads. Sent only after the delete ran, so a refused delete or a detour through the
 * password confirmation never shows it.
 */
final readonly class PasskeyDeletedResponse implements PasskeyDeletedResponseContract
{
    public function toResponse(mixed $request): JsonResponse|RedirectResponse
    {
        if ($request->wantsJson()) {
            return new JsonResponse(['status' => 'passkey-deleted'], 200);
        }

        Inertia::flash('success', 'Llave de acceso eliminada');

        return back();
    }
}
