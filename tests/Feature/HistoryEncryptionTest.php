<?php

declare(strict_types=1);

use App\Models\User;

it('asks the browser to encrypt each page it keeps in history', function (): void {
    $response = $this->actingAs(User::factory()->create())->get(route('team.index'));

    expect($response->viewData('page')['encryptHistory'])->toBe(true);
});
