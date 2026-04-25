<?php

declare(strict_types=1);

use App\Models\User;
use Laravel\Fortify\Features;

it('renders the login page with Fortify view binding', function (): void {
    $response = $this->from('/')
        ->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->has('canResetPassword')
            ->has('canRegister')
            ->has('status'));
});

it('preserves redirect query param to url.intended', function (): void {
    $response = $this->get(route('login', ['redirect' => '/settings/profile']));

    $response->assertOk()
        ->assertSessionHas('url.intended', '/settings/profile');
});

it('renders the register page with Fortify view binding', function (): void {
    $response = $this->get(route('register'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/register'));
});

it('renders the forgot password page with Fortify view binding', function (): void {
    $response = $this->from('/')
        ->get(route('password.request'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/forgot-password')
            ->has('status'));
});

it('renders the reset password page with Fortify view binding', function (): void {
    $response = $this->from('/')
        ->get(route('password.reset', ['token' => 'fake-token']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/reset-password')
            ->has('token'));
});

it('renders the verify email page with Fortify view binding', function (): void {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)
        ->get(route('verification.notice'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/verify-email')
            ->has('status'));
});

it('renders the two-factor challenge page with Fortify view binding', function (): void {
    $user = User::factory()->create([
        'two_factor_secret' => encrypt('secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ]);

    session()->put('login.id', $user->id);

    $response = $this->get(route('two-factor.login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/two-factor-challenge'));
});

it('renders the login page with canRegister true when registration is enabled', function (): void {
    config()->set('fortify.features', [
        Features::registration(),
        Features::resetPasswords(),
    ]);

    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->where('canRegister', true));
});

it('renders the login page with canRegister false when registration is disabled', function (): void {
    config()->set('fortify.features', [
        Features::resetPasswords(),
    ]);

    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->where('canRegister', false));
});

it('renders the confirm password page with Fortify view binding', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('password.confirm'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/confirm-password'));
});
