<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

it('renders the email verification page', function (): void {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user);

    $page = visitWithoutAnimations('/verify-email');

    $page->assertSee('Verificar correo')
        ->assertSee('Por favor verifica tu correo electrónico haciendo click en la liga que te enviamos.')
        ->assertSee('Reenviar correo de verificación')
        ->assertNoJavaScriptErrors();
});

it('can request a new verification email', function (): void {
    Notification::fake();

    $user = User::factory()->unverified()->create();

    $this->actingAs($user);

    $page = visitWithoutAnimations('/verify-email');

    $page->press('Reenviar correo de verificación')
        ->assertSee('Se ha enviado una nueva liga de verificación al correo que proporcionaste durante el registro.')
        ->assertNoJavaScriptErrors();

    Notification::assertSentTo(
        $user,
        VerifyEmail::class,
    );
});
