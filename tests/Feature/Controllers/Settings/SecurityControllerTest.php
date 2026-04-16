<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('renders the security settings page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('security.edit'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/security')
            ->has('canManageTwoFactor')
            ->has('twoFactorEnabled')
            ->has('requiresConfirmation'));
});

it('shows two factor disabled when not enabled', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('security.edit'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/security')
            ->where('twoFactorEnabled', false));
});

it('shows two factor enabled when enabled', function (): void {
    $user = User::factory()->create([
        'two_factor_secret' => encrypt('secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ]);

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('security.edit'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/security')
            ->where('twoFactorEnabled', true));
});

it('redirects to password.confirm when password has not been confirmed', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('dashboard')
        ->get(route('security.edit'));

    $response->assertRedirect(route('password.confirm'));
});

it('may update password', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('security.edit')
        ->put(route('user-password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectToRoute('security.edit')
        ->assertInertiaFlash('success', 'Contraseña actualizada');

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

it('requires current password to update', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('security.edit')
        ->put(route('user-password.update'), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectToRoute('security.edit')
        ->assertSessionHasErrors('current_password');
});

it('requires correct current password to update', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('security.edit')
        ->put(route('user-password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectToRoute('security.edit')
        ->assertSessionHasErrors('current_password');
});

it('requires new password to update', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('security.edit')
        ->put(route('user-password.update'), [
            'current_password' => 'old-password',
        ]);

    $response->assertRedirectToRoute('security.edit')
        ->assertSessionHasErrors('password');
});
