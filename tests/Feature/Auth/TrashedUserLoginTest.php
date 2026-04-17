<?php

declare(strict_types=1);

use App\Models\User;

it('denies login to a soft-deleted user', function (): void {
    $user = User::factory()->create(['email' => 'trashed@example.com']);
    $user->delete();

    // After soft-delete, the email is mutated. Login with original email
    // should not find any non-trashed user.
    $this->post('/login', [
        'email' => 'trashed@example.com',
        'password' => 'Password1234!',
    ]);

    $this->assertGuest();
});

it('allows login to a non-trashed user', function (): void {
    $user = User::factory()->create([
        'email' => 'active@example.com',
        'password' => 'Password1234!',
    ]);

    $response = $this->post('/login', [
        'email' => 'active@example.com',
        'password' => 'Password1234!',
    ]);

    expect($response->status())->toBeLessThan(400);
    $this->assertAuthenticatedAs($user);
});

it('denies login to a soft-deleted user even when using the parked email', function (): void {
    $user = User::factory()->create(['email' => 'alice@example.com']);
    $user->delete();

    // Try to log in with the mutated "parked" email — should still fail
    // because the user is trashed and our authenticateUsing checks trashed().
    $this->post('/login', [
        'email' => $user->refresh()->email,
        'password' => 'Password1234!',
    ]);

    $this->assertGuest();
});
