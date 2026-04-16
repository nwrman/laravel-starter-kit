<?php

declare(strict_types=1);

use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

it('resets a user password with valid input', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $action = new ResetUserPassword;

    $action->reset($user, [
        'password' => 'NewPassword1234!',
        'password_confirmation' => 'NewPassword1234!',
    ]);

    expect(Hash::check('NewPassword1234!', $user->refresh()->password))->toBeTrue();
});

it('rejects missing password', function (): void {
    $user = User::factory()->create();

    $action = new ResetUserPassword;

    expect(fn () => $action->reset($user, []))->toThrow(ValidationException::class);
});

it('rejects unconfirmed password', function (): void {
    $user = User::factory()->create();

    $action = new ResetUserPassword;

    expect(fn () => $action->reset($user, [
        'password' => 'NewPassword1234!',
        'password_confirmation' => 'Different!',
    ]))->toThrow(ValidationException::class);
});
