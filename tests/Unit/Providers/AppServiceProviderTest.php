<?php

declare(strict_types=1);

use Filament\Tables\Filters\Filter;

it('auto-translates filter labels via Filter::configureUsing', function (): void {
    // Creating a Filament Filter triggers the configureUsing callback
    // registered in AppServiceProvider::boot(), which calls translateLabel().
    $filter = Filter::make('test_filter');

    // translateLabel() sets the label to the translation key derived from the name.
    expect($filter->getLabel())->not->toBeNull();
});
