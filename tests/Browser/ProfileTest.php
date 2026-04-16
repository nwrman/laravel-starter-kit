<?php

declare(strict_types=1);

use App\Models\User;

it('renders the profile settings page', function (): void {
    $user = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);

    $this->actingAs($user);

    $page = visitWithoutAnimations('/settings/profile');

    $page->assertSee('Configuración')
        ->assertSee('Información del perfil')
        ->assertSee('Actualiza tu nombre y correo electrónico')
        ->assertPresent('#name')
        ->assertPresent('#email')
        ->assertNoJavaScriptErrors();
});

it('can update profile information', function (): void {
    $user = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);

    $this->actingAs($user);

    $page = visitWithoutAnimations('/settings/profile');

    $page->clear('#name')
        ->type('#name', 'Updated Name')
        ->clear('#email')
        ->type('#email', 'updated@example.com')
        ->press('[data-test="update-profile-button"]')
        ->assertSee('Perfil actualizado')
        ->assertSee('Updated Name')
        ->assertNoJavaScriptErrors();

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ]);
});

it('can delete account with password confirmation', function (): void {
    $user = User::factory()->create([
        'password' => 'password',
    ]);

    $this->actingAs($user);

    $page = visitWithoutAnimations('/settings/profile');

    $page->assertSee('Eliminar cuenta')
        ->click('[data-testid="delete-user-card"] button')
        ->waitForText('¿Eliminar tu cuenta?')
        ->type('#password', 'password')
        ->click('[data-slot="alert-dialog-content"] button[type="submit"]')
        ->assertPathIs('/login')
        ->assertNoJavaScriptErrors();

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});
