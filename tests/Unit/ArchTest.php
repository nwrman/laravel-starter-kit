<?php

declare(strict_types=1);

use App\Providers\Filament\AdminPanelProvider;
use App\Services\DemoDataService;

arch()->preset()->php();
arch()->preset()->strict()->ignoring([
    DemoDataService::class,
    'App\Models', // Eloquent Attribute accessors require protected methods
    'App\Filament', // Filament pages expose framework hooks as `protected`
]);
arch()->preset()->laravel()->ignoring([
    DemoDataService::class,
    AdminPanelProvider::class, // Filament's PanelProvider convention is not `*ServiceProvider`
]);
arch()->preset()->security()->ignoring([
    'assert',
]);

arch('controllers')
    ->expect('App\Http\Controllers')
    ->not->toBeUsed();

//
