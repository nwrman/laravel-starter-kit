<?php

declare(strict_types=1);

use App\Models\User;

it('closes the mobile sidebar after navigating', function (): void {
    $this->actingAs(User::factory()->create());

    // The layout is persistent, so an Inertia visit leaves the sheet covering the page
    // it just navigated to unless something closes it.
    visit('/dashboard')->on()->mobile()
        ->click('[data-sidebar="trigger"]')
        ->assertVisible('[data-mobile="true"]')
        ->click('Equipo')
        ->assertPathIs('/team')
        ->assertMissing('[data-mobile="true"]')
        ->assertNoJavaScriptErrors();
});

it('reaches nested nav items from the collapsed sidebar', function (): void {
    $this->actingAs(User::factory()->create());

    // assertVisible (not assertPresent) is load-bearing: the original bug rendered the
    // sub-list into the DOM and hid it with display:none, which jsdom cannot catch
    // because the frontend suite runs with css disabled.
    visitWithoutAnimations('/dashboard')
        ->click('[data-sidebar="trigger"]')
        ->click('[data-sidebar="menu-button"]:has-text("Proyectos")')
        ->assertVisible('[role="menuitem"]:has-text("Todos los Proyectos")')
        ->click('[role="menuitem"]:has-text("Todos los Proyectos")')
        ->assertPathIs('/projects')
        ->assertNoJavaScriptErrors();
});
