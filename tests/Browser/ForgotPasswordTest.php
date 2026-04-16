<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

it('renders the forgot password page', function (): void {
    $page = visitWithoutAnimations('/forgot-password');

    $page->assertSee('Recuperar contraseña')
        ->assertSee('Ingresa tu correo para recibir una liga de recuperación')
        ->assertPresent('#email')
        ->assertSee('Enviar liga de recuperación')
        ->assertNoJavaScriptErrors();
});

it('can request a password reset link', function (): void {
    Notification::fake();

    User::factory()->create([
        'email' => 'browser@example.com',
    ]);

    $page = visitWithoutAnimations('/forgot-password');

    $page->type('#email', 'browser@example.com')
        ->press('[data-test="email-password-reset-link-button"]')
        ->assertSee('Hemos enviado por correo la liga para actualizar tu contraseña.')
        ->assertNoJavaScriptErrors();

    Notification::assertSentTo(
        User::query()->where('email', 'browser@example.com')->first(),
        ResetPassword::class,
    );
});

it('has a link back to login', function (): void {
    $page = visitWithoutAnimations('/forgot-password');

    $page->click('iniciar sesión')
        ->assertPathIs('/login')
        ->assertNoJavaScriptErrors();
});

it('can reset password with a valid token', function (): void {
    $user = User::factory()->create([
        'email' => 'reset@example.com',
    ]);

    $token = Password::createToken($user);

    $page = visitWithoutAnimations('/reset-password/'.$token.'?email=reset@example.com');

    $page->assertPresent('#email')
        ->assertPresent('#password')
        ->assertPresent('#password_confirmation')
        ->type('#password', 'new-secure-password')
        ->type('#password_confirmation', 'new-secure-password')
        ->press('[data-test="reset-password-button"]')
        ->assertPathIs('/login')
        ->assertSee('Tu contraseña ha sido actualizada.')
        ->assertNoJavaScriptErrors();

    expect(Hash::check('new-secure-password', $user->fresh()->password))->toBeTrue();
});
