<?php

declare(strict_types=1);

use App\Actions\Fortify\CreateNewUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

it('creates a user with valid input', function (): void {
    $action = new CreateNewUser;

    $user = $action->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Password1234!',
        'password_confirmation' => 'Password1234!',
    ]);

    expect($user)->toBeInstanceOf(User::class);
    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->id)->toMatch('/^[0-9a-z]{26}$/i'); // ULID
    expect(Hash::check('Password1234!', $user->password))->toBeTrue();
    expect($user->email_verified_at)->not->toBeNull();
});

it('rejects missing name', function (): void {
    $action = new CreateNewUser;

    expect(fn (): User => $action->create([
        'email' => 'test@example.com',
        'password' => 'Password1234!',
        'password_confirmation' => 'Password1234!',
    ]))->toThrow(ValidationException::class);
});

it('rejects missing email', function (): void {
    $action = new CreateNewUser;

    expect(fn (): User => $action->create([
        'name' => 'Test User',
        'password' => 'Password1234!',
        'password_confirmation' => 'Password1234!',
    ]))->toThrow(ValidationException::class);
});

it('rejects missing password', function (): void {
    $action = new CreateNewUser;

    expect(fn (): User => $action->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]))->toThrow(ValidationException::class);
});

it('rejects unconfirmed password', function (): void {
    $action = new CreateNewUser;

    expect(fn (): User => $action->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Password1234!',
        'password_confirmation' => 'Different!',
    ]))->toThrow(ValidationException::class);
});

it('rejects duplicate email', function (): void {
    User::factory()->create(['email' => 'existing@example.com']);

    $action = new CreateNewUser;

    expect(fn (): User => $action->create([
        'name' => 'Test User',
        'email' => 'existing@example.com',
        'password' => 'Password1234!',
        'password_confirmation' => 'Password1234!',
    ]))->toThrow(ValidationException::class);
});

it('rejects invalid email format', function (): void {
    $action = new CreateNewUser;

    expect(fn (): User => $action->create([
        'name' => 'Test User',
        'email' => 'not-an-email',
        'password' => 'Password1234!',
        'password_confirmation' => 'Password1234!',
    ]))->toThrow(ValidationException::class);
});
