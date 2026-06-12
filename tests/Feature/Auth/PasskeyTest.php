<?php

declare(strict_types=1);

use App\Models\User;

it('lets an authenticated user delete a passkey', function (): void {
    $user = User::factory()->create();

    $passkey = $user->passkeys()->create([
        'name' => 'Old Phone',
        'credential_id' => 'credential-delete-id',
        'credential' => ['aaguid' => '00000000-0000-0000-0000-000000000000'],
    ]);

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $this->fromRoute('security.edit')
        ->delete(route('passkey.destroy', $passkey))
        ->assertRedirect();

    expect($user->passkeys()->count())->toBe(0);
});

it('exposes passkey login options to guests', function (): void {
    $this->get(route('passkey.login-options'))
        ->assertOk();
});
