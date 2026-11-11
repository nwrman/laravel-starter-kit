<?php

declare(strict_types=1);

use App\Models\User;

/*
 * Sidebar links make instant visits to the panel pages (docs/adr/0019). Whether a page draws
 * with only the shared props is pinned by resources/js/config/navigation.test.tsx; locally
 * the server answers before that render paints, so this spec cannot see it. It covers what
 * the jsdom suite cannot: real Inertia visits between the panel pages, each drawing its frame
 * and filling in, with no JavaScript error on the way.
 */
it('moves between the panel pages from the sidebar without an error', function (): void {
    $this->actingAs(User::factory()->create());

    visitWithoutAnimations('/projects/create')
        ->click('[data-sidebar="menu-button"]:has-text("Equipo")')
        ->assertPathIs('/team')
        ->assertSee('Total Miembros')
        ->assertVisible('input[placeholder^="Buscar personas"]')
        ->waitForText('Equipo por Departamento')
        ->click('[data-sidebar="menu-button"]:has-text("Inicio")')
        ->assertPathIs('/dashboard')
        ->assertSee('Ingresos Mensuales')
        ->assertDontSee('Ocurrió un error inesperado')
        ->assertNoJavaScriptErrors();
});
