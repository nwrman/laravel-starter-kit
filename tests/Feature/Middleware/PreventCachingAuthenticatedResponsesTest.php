<?php

declare(strict_types=1);

use App\Models\User;

it('tells the browser not to keep a signed-in page', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('team.index'))
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-store, private');
});

it('covers the Inertia visits of a signed-in user too', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('team.index'), inertiaHeaders())
        ->assertOk()
        ->assertHeader('X-Inertia', 'true')
        ->assertHeader('Cache-Control', 'no-store, private');
});

it('leaves a guest page cacheable as before', function (): void {
    $this->get(route('login'))
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-cache, private');
});
