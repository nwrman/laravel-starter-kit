<?php

declare(strict_types=1);

it('returns a csrf token', function (): void {
    $response = $this->getJson(route('csrf-token'));

    $response->assertOk()
        ->assertJsonStructure(['token']);
});

it('does not require authentication', function (): void {
    $response = $this->getJson(route('csrf-token'));

    $response->assertOk();
});
