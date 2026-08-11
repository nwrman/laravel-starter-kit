<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;

function resetPasswordMailHtml(): string
{
    return (string) new ResetPassword('fake-token')->toMail(User::factory()->create())->render();
}

it('renders framework mail with the branded theme', function (): void {
    expect(resetPasswordMailHtml())
        ->toContain('#00397f')
        ->toContain(config('app.name'));
});

it('shows the brand mark in the header as an absolute url', function (): void {
    expect(resetPasswordMailHtml())->toContain(asset('email-logo.png'));
});

it('ships the generated brand assets at their declared sizes', function (): void {
    $assets = [
        public_path('email-logo.png') => [96, 96],
        public_path('og-image.png') => [1200, 630],
        public_path('web-app-manifest-192x192.png') => [192, 192],
        public_path('web-app-manifest-512x512.png') => [512, 512],
    ];

    foreach ($assets as $path => [$width, $height]) {
        expect($path)->toBeFile();

        expect(array_slice(getimagesize($path), 0, 2))->toBe([$width, $height]);
    }
});
