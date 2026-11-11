<?php

declare(strict_types=1);

use App\Models\User;

it('renders dashboard with no page data up front, so an instant visit can draw it', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->missing('kpiStats')
            ->missing('charts')
            ->missing('feed'));
});

it('redirects unauthenticated users to login', function (): void {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});

it('defers the stat figures, keyed for the cards the page draws', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->loadDeferredProps('kpiStats', fn ($reload) => $reload
                ->where('kpiStats', fn ($stats): bool => collect($stats)->pluck('key')->all() === ['revenue', 'active-projects', 'team-members', 'completion-rate'])
                ->has('kpiStats.0', fn ($stat) => $stat
                    ->hasAll(['key', 'value', 'description', 'trend'])
                    ->missing('title')
                    ->missing('icon')
                    ->etc())));
});
