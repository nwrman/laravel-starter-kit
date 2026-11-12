<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Test Enforcement
    |--------------------------------------------------------------------------
    |
    | Boost adds its "tests rules" guideline only when `php artisan test
    | --list-tests` lists enough tests. Under Pest's TIA mode that command
    | lists only the affected tests, often none, so the guideline appeared
    | and vanished between regenerations. Pinned on.
    |
    */

    'enforce_tests' => true,

];
