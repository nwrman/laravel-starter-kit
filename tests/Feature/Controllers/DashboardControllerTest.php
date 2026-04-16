<?php

declare(strict_types=1);

use App\Models\User;

it('renders dashboard for authenticated users', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('kpiStats'));
});

it('redirects unauthenticated users to login', function (): void {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});

it('dashboard kpiStats contains 4 items', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('kpiStats', 4));
});
