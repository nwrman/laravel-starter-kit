<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('creates an administrator', function (): void {
    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-long-enough-password',
        '--name' => 'Jane Owner',
    ])->assertExitCode(0);

    $user = User::query()->where('email', 'owner@example.com')->sole();

    expect($user->name)->toBe('Jane Owner')
        ->and($user->is_admin)->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(Hash::check('a-long-enough-password', $user->password))->toBeTrue();
});

it('defaults the name when none is given', function (): void {
    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-long-enough-password',
    ])->assertExitCode(0);

    expect(User::query()->where('email', 'owner@example.com')->sole()->name)
        ->toBe('Administrator');
});

it('never prints the password', function (): void {
    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-long-enough-password',
    ])
        ->doesntExpectOutputToContain('a-long-enough-password')
        ->assertExitCode(0);
});

it('requires both email and password', function (array $options): void {
    $this->artisan('app:create-admin', $options)
        ->expectsOutputToContain('Both --email and --password are required.')
        ->assertExitCode(1);

    expect(User::query()->count())->toBe(0);
})->with([
    'neither' => [[]],
    'email only' => [['--email' => 'owner@example.com']],
    'password only' => [['--password' => 'a-long-enough-password']],
]);

it('rejects a malformed email', function (): void {
    $this->artisan('app:create-admin', [
        '--email' => 'not-an-email',
        '--password' => 'a-long-enough-password',
    ])->assertExitCode(1);

    expect(User::query()->count())->toBe(0);
});

it('rejects a password shorter than twelve characters', function (): void {
    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'short',
    ])->assertExitCode(1);

    expect(User::query()->count())->toBe(0);
});

it('refuses to touch an existing user without --force', function (): void {
    $existing = User::factory()->create([
        'email' => 'owner@example.com',
        'is_admin' => false,
    ]);

    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-long-enough-password',
    ])
        ->expectsOutputToContain('already exists')
        ->assertExitCode(1);

    expect($existing->fresh()?->is_admin)->toBeFalse();
});

it('promotes and resets an existing user with --force', function (): void {
    User::factory()->create([
        'email' => 'owner@example.com',
        'is_admin' => false,
    ]);

    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-brand-new-password',
        '--force' => true,
    ])->assertExitCode(0);

    $user = User::query()->where('email', 'owner@example.com')->sole();

    expect($user->is_admin)->toBeTrue()
        ->and(Hash::check('a-brand-new-password', $user->password))->toBeTrue();
});

it('keeps an existing verification timestamp when promoting', function (): void {
    $verifiedAt = now()->subMonth();

    User::factory()->create([
        'email' => 'owner@example.com',
        'email_verified_at' => $verifiedAt,
    ]);

    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-long-enough-password',
        '--force' => true,
    ])->assertExitCode(0);

    expect(User::query()->where('email', 'owner@example.com')->sole()->email_verified_at?->timestamp)
        ->toBe($verifiedAt->timestamp);
});

it('verifies an unverified user when promoting', function (): void {
    User::factory()->unverified()->create(['email' => 'owner@example.com']);

    $this->artisan('app:create-admin', [
        '--email' => 'owner@example.com',
        '--password' => 'a-long-enough-password',
        '--force' => true,
    ])->assertExitCode(0);

    expect(User::query()->where('email', 'owner@example.com')->sole()->email_verified_at)
        ->not->toBeNull();
});
