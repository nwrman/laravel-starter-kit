<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use Filament\Actions\CreateAction;
use Filament\Pages\Concerns\ExposesTableToWidgets;
use Filament\Resources\Pages\ListRecords;
use Filament\Schemas\Components\Tabs\Tab;
use Illuminate\Database\Eloquent\Builder;

final class ListUsers extends ListRecords
{
    use ExposesTableToWidgets;

    protected static string $resource = UserResource::class;

    /**
     * @return array<string, Tab>
     */
    public function getTabs(): array
    {
        return [
            'all' => Tab::make(__('All')),
            'admins' => Tab::make(__('Admins'))
                ->query(fn (Builder $query) => $query->where('is_admin', true)),
            'verified' => Tab::make(__('Verified'))
                ->query(fn (Builder $query) => $query->whereNotNull('email_verified_at')),
            'unverified' => Tab::make(__('Unverified'))
                ->query(fn (Builder $query) => $query->whereNull('email_verified_at')),
        ];
    }

    /**
     * @return array<int, CreateAction>
     */
    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }

    /**
     * @return array<class-string>
     */
    protected function getHeaderWidgets(): array
    {
        return array_values(UserResource::getWidgets());
    }
}
