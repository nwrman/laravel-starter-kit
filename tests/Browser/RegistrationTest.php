<?php

declare(strict_types=1);

use App\Models\User;

it('renders the registration page', function (): void {
    $page = visitWithoutAnimations('/register');

    $page->assertSee('Crea tu cuenta')
        ->assertPresent('#name')
        ->assertPresent('#email')
        ->assertPresent('#password')
        ->assertPresent('#password_confirmation')
        ->assertSee('Crear cuenta')
        ->assertNoJavaScriptErrors();
});

it('can register a new user', function (): void {
    $page = visitWithoutAnimations('/register');

    $page->type('#name', 'Test User')
        ->type('#email', 'test@example.com')
        ->type('#password', 'password')
        ->type('#password_confirmation', 'password')
        ->press('[data-test="register-button"]')
        ->assertPathIs('/dashboard')
        ->assertNoJavaScriptErrors();

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
});

it('shows validation errors for duplicate email', function (): void {
    User::factory()->create(['email' => 'taken@example.com']);

    $page = visitWithoutAnimations('/register');

    $page->type('#name', 'Test User')
        ->type('#email', 'taken@example.com')
        ->type('#password', 'password')
        ->type('#password_confirmation', 'password')
        ->press('[data-test="register-button"]')
        ->assertPathIs('/register')
        ->assertNoJavaScriptErrors();
});

it('has a link to login', function (): void {
    $page = visitWithoutAnimations('/register');

    $page->click('Inicia sesión')
        ->assertPathIs('/login')
        ->assertNoJavaScriptErrors();
});

it('login page has a link to register', function (): void {
    $page = visitWithoutAnimations('/login');

    $page->click('Regístrate')
        ->assertPathIs('/register')
        ->assertSee('Crea tu cuenta')
        ->assertNoJavaScriptErrors();
});
