<?php

declare(strict_types=1);

use App\Models\User;

it('requires authentication', function (): void {
    $response = $this->delete(route('user.destroy'));

    $response->assertRedirect(route('login', ['session_expired' => true]));
});

it('requires a valid password', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('user.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response->assertSessionHasErrors('password');

    expect(User::query()->find($user->id))->not->toBeNull();
});

it('deletes the user and invalidates the session', function (): void {
    $user = User::factory()->create([
        'password' => 'correct-password',
    ]);

    $response = $this->actingAs($user)
        ->delete(route('user.destroy'), [
            'password' => 'correct-password',
        ]);

    $response->assertRedirectToRoute('login');

    expect(User::query()->find($user->id))->toBeNull();
    $this->assertGuest();
});
