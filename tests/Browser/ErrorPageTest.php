<?php

declare(strict_types=1);

use App\Models\User;

/*
 * The error page is disabled in local and testing (AppServiceProvider), so these
 * must pose as production to reach it at all. A feature test cannot stand in:
 * the server renders component "error" either way — the crash was client-side.
 */
beforeEach(function (): void {
    $this->app->detectEnvironment(fn (): string => 'production');
});

it('shows a signed-out visitor the error page, not the error boundary', function (): void {
    visitWithoutAnimations('/this-route-does-not-exist')
        ->assertSee('Página no encontrada')
        ->assertDontSee('Ocurrió un error inesperado')
        ->assertMissing('[data-test="sidebar-menu-button"]')
        ->assertNoJavaScriptErrors();
});

it('shows a signed-in user the error page inside the app shell', function (): void {
    $this->actingAs(User::factory()->create());

    visitWithoutAnimations('/this-route-does-not-exist')
        ->assertSee('Página no encontrada')
        ->assertPresent('[data-test="sidebar-menu-button"]')
        ->assertNoJavaScriptErrors();
});
