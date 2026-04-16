<?php

declare(strict_types=1);

use App\Models\User;

it('renders the login page', function (): void {
    $page = visitWithoutAnimations('/login');

    $page->assertSee('Inicia sesión en tu cuenta')
        ->assertSee('Correo electrónico')
        ->assertSee('Contraseña')
        ->assertPresent('#email')
        ->assertPresent('#password')
        ->assertSee('Iniciar sesión')
        ->assertNoJavaScriptErrors();
});

it('can log in with valid credentials', function (): void {
    User::factory()->create([
        'email' => 'browser@example.com',
        'password' => 'Password1234!',
    ]);

    $page = visitWithoutAnimations('/login');

    $page->type('#email', 'browser@example.com')
        ->type('#password', 'Password1234!')
        ->press('[data-test="login-button"]')
        ->assertPathIs('/dashboard')
        ->assertSee('Inicio')
        ->assertNoJavaScriptErrors();

    $this->assertAuthenticated();
});

it('shows validation errors with invalid credentials', function (): void {
    User::factory()->create([
        'email' => 'browser@example.com',
        'password' => 'Password1234!',
    ]);

    $page = visitWithoutAnimations('/login');

    $page->type('#email', 'browser@example.com')
        ->type('#password', 'wrong-password')
        ->press('[data-test="login-button"]')
        ->assertPathIs('/login')
        ->assertSee('Estas credenciales no coinciden con nuestros registros.')
        ->assertNoJavaScriptErrors();

    $this->assertGuest();
});

it('has a link to forgot password', function (): void {
    $page = visitWithoutAnimations('/login');

    $page->click('¿Olvidaste tu contraseña?')
        ->assertPathIs('/forgot-password')
        ->assertSee('Recuperar contraseña')
        ->assertNoJavaScriptErrors();
});
