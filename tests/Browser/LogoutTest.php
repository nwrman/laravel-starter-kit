<?php

declare(strict_types=1);

use App\Models\User;

it('can log out', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user);

    $page = visitWithoutAnimations('/dashboard');

    $page->assertSee('Inicio')
        ->click('[data-test="sidebar-menu-button"], [data-test="user-menu-trigger"]') // Sidebar or header user dropdown
        ->click('[data-test="logout-button"]')
        ->assertPathIs('/login')
        ->assertSee('Inicia sesión en tu cuenta')
        ->assertNoJavaScriptErrors();

    $this->assertGuest();
});

it('leaves nothing from the account behind the back button', function (): void {
    $this->actingAs(User::factory()->create());

    // Logout is a full page load (ADR 0018), so the signed-in document is left behind, and it
    // was sent no-store: Back fetches it again and the server answers with the login screen.
    visitWithoutAnimations('/team')
        ->assertSee('Total Miembros')
        ->click('[data-test="sidebar-menu-button"]')
        ->click('[data-test="logout-button"]')
        ->assertPathIs('/login')
        ->back()
        ->assertPathIs('/login')
        ->assertSee('Inicia sesión en tu cuenta')
        ->assertDontSee('Total Miembros')
        ->assertNoJavaScriptErrors();

    $this->assertGuest();
});
