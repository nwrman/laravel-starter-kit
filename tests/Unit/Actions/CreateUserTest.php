<?php

declare(strict_types=1);

use App\Actions\CreateUser;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;

it('creates a user with the given attributes and password', function (): void {
    Event::fake([Registered::class]);

    $user = resolve(CreateUser::class)->handle(
        ['name' => 'John Doe', 'email' => 'john@example.com'],
        'secret-password',
    );

    expect($user)->toBeInstanceOf(User::class)
        ->and($user->name)->toBe('John Doe')
        ->and($user->email)->toBe('john@example.com')
        ->and(User::query()->find($user->id))->not->toBeNull();
});

it('fires the Registered event', function (): void {
    Event::fake([Registered::class]);

    $user = resolve(CreateUser::class)->handle(
        ['name' => 'Jane Doe', 'email' => 'jane@example.com'],
        'secret-password',
    );

    Event::assertDispatched(Registered::class, fn (Registered $event): bool => $event->user->is($user));
});
