<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;

it('renders framework mail with the branded theme', function (): void {
    $user = User::factory()->create();

    $html = (string) new ResetPassword('fake-token')->toMail($user)->render();

    expect($html)
        ->toContain('email-logo.png')
        ->toContain(config('app.name'))
        ->toContain('#00397f');
});

it('links the header logo to the app url', function (): void {
    $user = User::factory()->create();

    $html = (string) new ResetPassword('fake-token')->toMail($user)->render();

    expect($html)->toContain(asset('email-logo.png'));
});

it('ships the email logo at its expected size', function (): void {
    $path = public_path('email-logo.png');

    expect($path)->toBeFile();

    [$width, $height] = getimagesize($path);

    expect([$width, $height])->toBe([400, 100]);
});
