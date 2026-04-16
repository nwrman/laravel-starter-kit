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
