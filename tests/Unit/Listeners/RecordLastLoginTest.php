<?php

declare(strict_types=1);

use App\Listeners\RecordLastLogin;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Date;

it('sets last_login_at to now when a login event fires', function (): void {
    Date::setTestNow('2026-04-16 12:00:00');

    $user = User::factory()->create(['last_login_at' => null]);

    $listener = resolve(RecordLastLogin::class);
    $listener->handle(new Login('web', $user, remember: false));

    expect($user->fresh()?->last_login_at?->toDateTimeString())
        ->toBe('2026-04-16 12:00:00');
});

it('overwrites an existing last_login_at', function (): void {
    Date::setTestNow('2026-04-16 12:00:00');

    $user = User::factory()->create([
        'last_login_at' => Date::parse('2026-01-01 00:00:00'),
    ]);

    $listener = resolve(RecordLastLogin::class);
    $listener->handle(new Login('web', $user, remember: false));

    expect($user->fresh()?->last_login_at?->toDateTimeString())
        ->toBe('2026-04-16 12:00:00');
});

it('ignores non-User authenticatable instances', function (): void {
    $nonUser = Mockery::mock(Authenticatable::class);

    $listener = resolve(RecordLastLogin::class);
    $listener->handle(new Login('web', $nonUser, remember: false));

    // No exception thrown — the listener gracefully returns.
    expect(true)->toBeTrue();
});
