<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Toolkit Overrides
|--------------------------------------------------------------------------
|
| Only the keys that differ from nwrman/laravel-toolkit's defaults. The package
| merges its own config underneath, so anything omitted here — gates, paths,
| suites, notifications — keeps the package value.
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Test Impact Analysis
    |--------------------------------------------------------------------------
    |
    | Lets a full `composer test` run replay only the tests the working tree
    | can actually affect. Pairs with `pest()->tia()` in tests/Pest.php —
    | neither half does anything on its own.
    |
    | Per-suite runs (composer test:unit and friends) are unaffected: TIA can't
    | engage on a partial selection, so they keep the faster driver-off path.
    |
    */

    'tia' => [
        'enabled' => env('TOOLKIT_TIA', true),
    ],

];
