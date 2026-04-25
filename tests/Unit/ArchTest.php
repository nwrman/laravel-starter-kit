<?php

declare(strict_types=1);

use App\Providers\Filament\AdminPanelProvider;
use App\Services\DemoDataService;
use Illuminate\Database\Eloquent\Factories\Factory;

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

arch('avoid open for extension')
    ->expect('App')
    ->classes()
    ->toBeFinal()
    ->ignoring([
        'App\Concerns', // Traits cannot be final
    ]);

arch('factories')
    ->expect('Database\Factories')
    ->toExtend(Factory::class)
    ->toHaveMethod('definition')
    ->toOnlyBeUsedIn([
        'App\Models',
    ]);

arch('models')
    ->expect('App\Models')
    ->toHaveMethod('casts');

arch('actions')
    ->expect('App\Actions')
    ->toHaveMethod('handle')
    ->ignoring([
        'App\Actions\Fortify',
    ]);

arch('globals')
    ->expect(['dda', 'da', 'dd', 'dump', 'ray'])
    ->not->toBeUsed();
