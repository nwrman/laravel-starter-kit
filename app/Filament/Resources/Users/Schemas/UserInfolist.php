<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Schemas;

use App\Models\User;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

final class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('email'),
                TextEntry::make('email_verified_at')
                    ->dateTime()
                    ->placeholder('—'),
                IconEntry::make('is_admin')
                    ->label(__('Administrator'))
                    ->boolean(),
                IconEntry::make('two_factor_confirmed_at')
                    ->label(__('Two-factor auth'))
                    ->boolean(),
                TextEntry::make('last_login_at')
                    ->dateTime()
                    ->placeholder('—'),
                TextEntry::make('created_at')
                    ->dateTime(),
                TextEntry::make('deleted_at')
                    ->dateTime()
                    ->placeholder('—')
                    ->visible(fn (?User $record): bool => $record?->trashed() === true),
            ]);
    }
}
