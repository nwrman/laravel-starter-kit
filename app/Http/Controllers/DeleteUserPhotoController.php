<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

final readonly class DeleteUserPhotoController
{
    public function __invoke(#[CurrentUser] User $user): RedirectResponse
    {
        $user->clearMediaCollection('photo');

        Inertia::flash('success', 'Foto de perfil eliminada');

        return to_route('user-profile.edit');
    }
}
