<?php

declare(strict_types=1);

it('renders open graph and twitter share tags', function (): void {
    config()->set('app.name', 'Acme');
    config()->set('app.description', 'Acme does things.');

    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertSee('<meta property="og:type" content="website" />', false)
        ->assertSee('<meta property="og:site_name" content="Acme" />', false)
        ->assertSee('<meta property="og:title" content="Acme" />', false)
        ->assertSee('<meta property="og:description" content="Acme does things." />', false)
        ->assertSee('<meta name="twitter:card" content="summary_large_image" />', false)
        ->assertSee('<meta name="twitter:title" content="Acme" />', false)
        ->assertSee('<meta name="description" content="Acme does things." />', false);
});

it('renders share image and url as absolute urls', function (): void {
    $image = asset('og-image.png');

    expect($image)->toStartWith('http');

    $this->get(route('login'))
        ->assertOk()
        ->assertSee('<meta property="og:image" content="'.$image.'" />', false)
        ->assertSee('<meta name="twitter:image" content="'.$image.'" />', false)
        ->assertSee('<meta property="og:url" content="'.route('login').'" />', false);
});

it('declares the share image dimensions', function (): void {
    $this->get(route('login'))
        ->assertSee('<meta property="og:image:width" content="1200" />', false)
        ->assertSee('<meta property="og:image:height" content="630" />', false);
});

it('ships the share image and manifest icons at their declared sizes', function (): void {
    $assets = [
        public_path('og-image.png') => [1200, 630],
        public_path('web-app-manifest-192x192.png') => [192, 192],
        public_path('web-app-manifest-512x512.png') => [512, 512],
    ];

    foreach ($assets as $path => [$width, $height]) {
        expect($path)->toBeFile();

        [$actualWidth, $actualHeight] = getimagesize($path);

        expect([$actualWidth, $actualHeight])->toBe([$width, $height]);
    }
});

it('references only manifest icons that exist', function (): void {
    $manifest = json_decode(file_get_contents(public_path('site.webmanifest')), true);

    expect($manifest['icons'])->not->toBeEmpty();

    foreach ($manifest['icons'] as $icon) {
        expect(public_path(mb_ltrim($icon['src'], '/')))->toBeFile();
    }
});
