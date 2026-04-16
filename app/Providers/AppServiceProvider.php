<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Database\Schema\Builder;
use Illuminate\Support\ServiceProvider;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Builder::defaultMorphKeyType('ulid');

        Inertia::handleExceptionsUsing(function (ExceptionResponse $response): mixed {
            if (app()->environment(['local', 'testing'])) {
                return null;
            }

            if (in_array($response->statusCode(), [403, 404, 500, 503], strict: true)) {
                return $response->render('error', [
                    'status' => $response->statusCode(),
                ])->withSharedData();
            }

            return null;
        });
    }
}
