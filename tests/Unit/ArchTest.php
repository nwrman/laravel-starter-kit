<?php

declare(strict_types=1);

use App\Services\DemoDataService;

arch()->preset()->php();
arch()->preset()->strict()->ignoring([
    DemoDataService::class,
    'App\Models', // Eloquent Attribute accessors require protected methods
]);
arch()->preset()->laravel()->ignoring([
    DemoDataService::class,
]);
arch()->preset()->security()->ignoring([
    'assert',
]);

arch('controllers')
    ->expect('App\Http\Controllers')
    ->not->toBeUsed();

//
