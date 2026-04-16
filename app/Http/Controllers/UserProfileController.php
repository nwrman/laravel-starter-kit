<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Media\ProcessAndAttachImage;
use App\Actions\UpdateUser;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class UserProfileController
{
    public function edit(Request $request, #[CurrentUser] User $user): Response
    {
        return Inertia::render('user-profile/edit', [
            'mustVerifyEmail' => ! $user->hasVerifiedEmail(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(
        UpdateUserRequest $request,
        #[CurrentUser] User $user,
        UpdateUser $updateUser,
        ProcessAndAttachImage $attachImage,
    ): RedirectResponse {
        $validated = $request->validated();
        $updateUser->handle($user, [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($request->hasFile('photo')) {
            $attachImage->handle($user, $request->file('photo'), maxWidth: 400, collection: 'photo');
        }

        Inertia::flash('success', 'Perfil actualizado');

        return to_route('user-profile.edit');
    }
}
