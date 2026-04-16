<?php

declare(strict_types=1);

use App\Models\User;

it('renders the two factor authentication page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user);

    $page = visitWithoutAnimations('/settings/two-factor');

    // Handle Fortify confirm-password redirection
    if (str_ends_with($page->url(), '/user/confirm-password')) {
        $page->type('#password', 'Password1234!')
            ->press('[data-test="confirm-password-button"]');
    }

    $page->assertSee('Autenticación de dos factores')
        ->assertSee('Administra la configuración de autenticación de dos factores')
        ->assertSee('Activar 2FA')
        ->assertNoJavaScriptErrors();
});
