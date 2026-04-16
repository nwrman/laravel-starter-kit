<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

it('renders login page', function (): void {
    $response = $this->from('/')
        ->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('session/create')
            ->has('canResetPassword')
            ->has('status')
            ->where('sessionExpired', false));
});

it('passes session expired prop when query param is present', function (): void {
    $response = $this->get(route('login', ['session_expired' => true]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('session/create')
            ->where('sessionExpired', true));
});

it('redirects unauthenticated users to login with session expired flag', function (): void {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login', ['session_expired' => true]));
});

it('may create a session', function (): void {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
    ]);

    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'Password1234!',
        ]);

    $response->assertRedirectToRoute('dashboard');

    $this->assertAuthenticatedAs($user);
});

it('records last_login_at on successful login', function (): void {
    Date::setTestNow('2026-04-16 12:00:00');

    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
        'last_login_at' => null,
    ]);

    $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'Password1234!',
        ]);

    expect($user->fresh()?->last_login_at?->toDateTimeString())
        ->toBe('2026-04-16 12:00:00');
});

it('does not record last_login_at when credentials are invalid', function (): void {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
        'last_login_at' => null,
    ]);

    $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

    expect($user->fresh()?->last_login_at)->toBeNull();
});

it('may create a session with remember me', function (): void {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
    ]);

    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'Password1234!',
            'remember' => true,
        ]);

    $response->assertRedirectToRoute('dashboard');

    $this->assertAuthenticatedAs($user);
});

it('redirects to two-factor challenge when enabled', function (): void {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
        'two_factor_secret' => encrypt('secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ]);

    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'Password1234!',
        ]);

    $response->assertRedirectToRoute('two-factor.login');

    $this->assertGuest();
});

it('fails with invalid credentials', function (): void {
    User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
    ]);

    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

    $response->assertRedirectToRoute('login')
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('requires email', function (): void {
    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'password' => 'Password1234!',
        ]);

    $response->assertRedirectToRoute('login')
        ->assertSessionHasErrors('email');
});

it('requires password', function (): void {
    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
        ]);

    $response->assertRedirectToRoute('login')
        ->assertSessionHasErrors('password');
});

it('may destroy a session', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('dashboard')
        ->post(route('logout'));

    $response->assertRedirectToRoute('login');

    $this->assertGuest();
});

it('redirects authenticated users away from login', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('dashboard')
        ->get(route('login'));

    $response->assertRedirectToRoute('dashboard');
});

it('throttles login attempts after too many failures', function (): void {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
    ]);

    // Make 5 failed login attempts to trigger rate limiting
    for ($i = 0; $i < 5; $i++) {
        $this->fromRoute('login')
            ->post(route('login.store'), [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
    }

    // The 6th attempt should be throttled
    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

    $response->assertRedirectToRoute('login')
        ->assertSessionHasErrors('email');

    $errors = session('errors');
    expect($errors->get('email')[0])->toContain('Demasiados intentos de inicio de sesión');
});

it('clears rate limit after successful login', function (): void {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
    ]);

    // Make a few failed attempts
    for ($i = 0; $i < 3; $i++) {
        $this->fromRoute('login')
            ->post(route('login.store'), [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
    }

    // Successful login should clear the rate limit
    $response = $this->fromRoute('login')
        ->post(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'Password1234!',
        ]);

    $response->assertRedirectToRoute('dashboard');
    $this->assertAuthenticatedAs($user);
});

it('dispatches lockout event when rate limit is reached', function (): void {
    Event::fake([Lockout::class]);

    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('Password1234!'),
    ]);

    // Make 6 failed login attempts to trigger rate limiting and Lockout event
    // The Lockout event fires on the 6th attempt when tooManyAttempts returns true
    for ($i = 0; $i < 6; $i++) {
        $this->fromRoute('login')
            ->post(route('login.store'), [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
    }

    Event::assertDispatched(Lockout::class);
});
