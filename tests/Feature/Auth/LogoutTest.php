<?php

declare(strict_types=1);

use App\Models\User;

it('logs the user out to the login page, which clears the browser history', function (): void {
    $this->actingAs(User::factory()->create());

    $this->post(route('logout'))->assertRedirect(route('login'));

    $this->assertGuest();

    // The flag rides the session to the next Inertia page: assert the page gets it.
    expect($this->get(route('login'))->viewData('page')['clearHistory'])->toBeTrue();
});

it('leaves the browser history alone on a plain visit to the login page', function (): void {
    // Inertia sends the key only when it is set.
    expect($this->get(route('login'))->viewData('page'))->not->toHaveKey('clearHistory');
});
