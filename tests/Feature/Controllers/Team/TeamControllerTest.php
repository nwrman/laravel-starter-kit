<?php

declare(strict_types=1);

use App\Models\User;

it('renders team/index with no page data up front, so an instant visit can draw it', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('team.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('team/index')
            ->missing('kpiStats')
            ->missing('tableData'));
});

it('loads deferred table data on team index', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('team.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('team/index')
            ->loadDeferredProps('tableData', fn ($reload) => $reload
                ->has('tableData.teamRows', 12)
                ->has('tableData.departmentDistribution', 6)));
});

it('defers the stat figures, keyed for the cards the page draws', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('team.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('team/index')
            ->loadDeferredProps('kpiStats', fn ($reload) => $reload
                ->where('kpiStats', fn ($stats): bool => collect($stats)->pluck('key')->all() === ['members', 'departments', 'utilization'])
                ->has('kpiStats.0', fn ($stat) => $stat
                    ->hasAll(['key', 'value', 'description', 'trend'])
                    ->missing('title')
                    ->missing('icon')
                    ->etc())));
});
