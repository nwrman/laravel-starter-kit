<?php

declare(strict_types=1);

use App\Models\User;

it('renders projects/index with no page data up front, so an instant visit can draw it', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/index')
            ->missing('kpiStats')
            ->missing('tableData')
            ->missing('chartData'));
});

it('loads deferred table and chart data on project index', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/index')
            ->loadDeferredProps('tableData', fn ($reload) => $reload
                ->has('tableData.projectRows', 15)
                ->has('tableData.projectMonthly', 12))
            ->loadDeferredProps('chartData', fn ($reload) => $reload
                ->has('chartData.projectRows')));
});

it('renders project detail page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.show', ['project' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/show')
            ->has('project'));
});

it('loads deferred activity on project detail', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.show', ['project' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/show')
            ->loadDeferredProps('activity', fn ($reload) => $reload
                ->has('activity.activityStats', 3)
                ->has('activity.billingMonthly', 12)));
});

it('returns 404 for invalid project', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.show', ['project' => 999]))
        ->assertNotFound();
});

it('renders project create page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/create'));
});

it('stores project and redirects', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), ['name' => 'Test Project'])
        ->assertRedirect(route('projects.index'));
});

it('defers the stat figures, keyed for the cards the page draws', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects/index')
            ->loadDeferredProps('kpiStats', fn ($reload) => $reload
                ->where('kpiStats', fn ($stats): bool => collect($stats)->pluck('key')->all() === ['active-projects', 'total-budget', 'completed-this-month'])
                ->has('kpiStats.0', fn ($stat) => $stat
                    ->hasAll(['key', 'value', 'description', 'trend'])
                    ->missing('title')
                    ->missing('icon')
                    ->etc())));
});
