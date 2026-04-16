<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    $this->app->detectEnvironment(fn (): string => 'production');
});

it('renders the error page for 404 when authenticated', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/this-route-does-not-exist')
        ->assertStatus(404)
        ->assertInertia(fn ($page) => $page
            ->component('error')
            ->where('status', 404));
});

it('renders the error page for 403 when authenticated', function (): void {
    $user = User::factory()->create();

    Route::get('/_test/forbidden', fn () => abort(403))->middleware('web');

    $this->actingAs($user)
        ->get('/_test/forbidden')
        ->assertStatus(403)
        ->assertInertia(fn ($page) => $page
            ->component('error')
            ->where('status', 403));
});

it('does not render the error page for unhandled status codes in production', function (): void {
    $user = User::factory()->create();

    Route::get('/_test/unhandled', fn () => abort(422))->middleware('web');

    $this->actingAs($user)
        ->get('/_test/unhandled')
        ->assertStatus(422);
});
