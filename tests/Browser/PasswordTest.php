<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('renders the security settings page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $page = visitWithoutAnimations('/settings/security');

    $page->assertSee('Actualizar contraseña')
        ->assertSee('Asegúrate de usar una contraseña larga y aleatoria para mantener tu cuenta segura')
        ->assertPresent('#current_password')
        ->assertPresent('#password')
        ->assertPresent('#password_confirmation')
        ->assertNoJavaScriptErrors();
});

it('can update the password', function (): void {
    $user = User::factory()->create([
        'password' => 'old-password',
    ]);

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $page = visitWithoutAnimations('/settings/security');

    $page->type('#current_password', 'old-password')
        ->type('#password', 'new-password')
        ->type('#password_confirmation', 'new-password')
        ->press('[data-test="update-password-button"]')
        ->assertSee('Contraseña actualizada')
        ->assertValue('#current_password', '')
        ->assertValue('#password', '')
        ->assertValue('#password_confirmation', '')
        ->assertNoJavaScriptErrors();

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});

it('shows server error when current password is incorrect', function (): void {
    $user = User::factory()->create([
        'password' => 'correct-password',
    ]);

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $page = visitWithoutAnimations('/settings/security');

    $page->type('#current_password', 'wrong-password')
        ->type('#password', 'new-password')
        ->type('#password_confirmation', 'new-password')
        ->press('[data-test="update-password-button"]')
        ->assertSee('La contraseña es incorrecta.')
        ->assertNoJavaScriptErrors();
});

it('resets field values after server error', function (): void {
    $user = User::factory()->create([
        'password' => 'correct-password',
    ]);

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $page = visitWithoutAnimations('/settings/security');

    $page->type('#current_password', 'wrong-password')
        ->type('#password', 'some-new-password')
        ->type('#password_confirmation', 'some-new-password')
        ->press('[data-test="update-password-button"]')
        ->assertSee('La contraseña es incorrecta.')
        ->assertValue('#current_password', '')
        ->assertValue('#password', '')
        ->assertValue('#password_confirmation', '')
        ->assertNoJavaScriptErrors();
});
