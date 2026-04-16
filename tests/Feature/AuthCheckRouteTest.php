<?php

declare(strict_types=1);

use App\Models\User;

it('returns authenticated status for logged in users', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson(route('auth-check'));

    $response->assertOk()
        ->assertJson(['authenticated' => true]);
});

it('redirects unauthenticated users', function (): void {
    $response = $this->getJson(route('auth-check'));

    $response->assertUnauthorized();
});
