<?php

declare(strict_types=1);

use App\Models\User;

it('turns the redirect after signing in into a full page load', function (): void {
    $user = User::factory()->create();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'Password1234!'], inertiaHeaders())
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

it('turns the redirect after signing out into a full page load', function (): void {
    $this->actingAs(User::factory()->create())
        ->post(route('logout'), [], inertiaHeaders())
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('login'));

    $this->assertGuest();
});

it('keeps an Inertia redirect that does not change who is signed in', function (): void {
    $user = User::factory()->create();

    $this->from(route('login'))
        ->post(route('login.store'), ['email' => $user->email, 'password' => config('anypass.wrong_password', '1_wrong_pass')], inertiaHeaders())
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

it('leaves a sign-in without Inertia as a plain redirect', function (): void {
    $user = User::factory()->create();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'Password1234!'])
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});
