<?php

declare(strict_types=1);

namespace App\Providers;

use Filament\Forms\Components\Field;
use Filament\Infolists\Components\Entry;
use Filament\Tables\Columns\Column;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Table;
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
            // Handle 419 (CSRF token mismatch) for non-Inertia requests
            // Inertia requests pass through so the frontend session-expired-handler can intercept them
            if ($response->statusCode() === 419 && ! $response->request->header('X-Inertia')) {
                return back()->with([
                    'error' => 'Tu sesión expiró por seguridad. Por favor, intenta de nuevo.',
                ]);
            }

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

        // Filament global defaults: auto-translate labels and set consistent table UX.
        Column::configureUsing(function (Column $column): void {
            $column->translateLabel();
        });

        Filter::configureUsing(function (Filter $filter): void {
            $filter->translateLabel();
        });

        Field::configureUsing(function (Field $field): void {
            $field->translateLabel();
        });

        Entry::configureUsing(function (Entry $entry): void {
            $entry->translateLabel();
        });

        Table::configureUsing(function (Table $table): void {
            $table
                ->striped()
                ->reorderableColumns()
                ->paginationPageOptions([10, 25, 50, 100]);
        });
    }
}
