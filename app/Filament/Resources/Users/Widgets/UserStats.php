<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Widgets;

use App\Filament\Resources\Users\Pages\ListUsers;
use Filament\Widgets\Concerns\InteractsWithPageTable;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

final class UserStats extends BaseWidget
{
    use InteractsWithPageTable;

    protected ?string $pollingInterval = null;

    protected function getTablePage(): string
    {
        return ListUsers::class;
    }

    protected function getStats(): array
    {
        $query = $this->getPageTableQuery();

        return [
            Stat::make(__('Total Users'), $query->count()),
            Stat::make(__('Admins'), (clone $query)->where('is_admin', true)->count())
                ->color('success'),
            Stat::make(__('New this week'), (clone $query)->where('created_at', '>=', now()->subWeek())->count())
                ->color('info'),
            Stat::make(__('Active 24h'), (clone $query)->where('last_login_at', '>=', now()->subDay())->count())
                ->color('warning'),
        ];
    }
}
