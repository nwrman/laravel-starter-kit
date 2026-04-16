<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

it('redirects back with error message for non-inertia 419 responses', function (): void {
    Route::post('/_test/csrf', fn () => abort(419))->middleware('web');

    $response = $this->from('/_test/previous-page')
        ->post('/_test/csrf');

    $response->assertRedirect('/_test/previous-page')
        ->assertSessionHas('error', 'Tu sesión expiró por seguridad. Por favor, intenta de nuevo.');
});

it('passes 419 through for inertia requests', function (): void {
    Route::post('/_test/csrf', fn () => abort(419))->middleware('web');

    $response = $this->post('/_test/csrf', [], ['X-Inertia' => 'true']);

    $response->assertStatus(419);
});

it('returns 401 for inertia requests to protected routes when unauthenticated', function (): void {
    $response = $this->get(route('dashboard'), ['X-Inertia' => 'true', 'X-Inertia-Version' => '1']);

    $response->assertStatus(401);
});

it('still redirects non-inertia unauthenticated requests to login', function (): void {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});
