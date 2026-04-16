<?php

declare(strict_types=1);

use App\Models\User;

it('renders team index for authenticated users', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('team.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('team/index')
            ->has('kpiStats'));
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

it('team kpiStats contains 3 items', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('team.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('team/index')
            ->has('kpiStats', 3));
});
