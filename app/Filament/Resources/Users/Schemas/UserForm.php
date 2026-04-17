<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Schemas;

use App\Models\User;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

final class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make(__('User'))
                    ->tabs([
                        Tab::make(__('Personal'))
                            ->icon(Heroicon::User)
                            ->columns(2)
                            ->schema([
                                TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('email')
                                    ->required()
                                    ->email()
                                    ->maxLength(255)
                                    ->unique(User::class, 'email', ignoreRecord: true),
                            ]),
                        Tab::make(__('Security'))
                            ->icon(Heroicon::ShieldCheck)
                            ->columns(2)
                            ->schema([
                                TextInput::make('password')
                                    ->password()
                                    ->revealable()
                                    ->dehydrateStateUsing(fn (?string $state): ?string => filled($state) ? $state : null)
                                    ->dehydrated(fn (?string $state): bool => filled($state))
                                    ->required(fn (string $operation): bool => $operation === 'create')
                                    ->maxLength(255),
                                Toggle::make('is_admin')
                                    ->label(__('Administrator')),
                                DateTimePicker::make('email_verified_at')
                                    ->label(__('Email verified')),
                                Placeholder::make('two_factor_status')
                                    ->label(__('Two-factor auth'))
                                    ->content(fn (?User $record): string => $record?->two_factor_confirmed_at !== null ? __('Enabled') : __('Disabled')),
                            ]),
                        Tab::make(__('Metadata'))
                            ->icon(Heroicon::DocumentText)
                            ->columns(2)
                            ->schema([
                                Placeholder::make('last_login_at_display')
                                    ->label(__('Last login'))
                                    ->content(fn (?User $record): string => $record?->last_login_at?->diffForHumans() ?? '—'),
                                Placeholder::make('created_at_display')
                                    ->label(__('Created'))
                                    ->content(fn (?User $record): string => $record?->created_at?->toDayDateTimeString() ?? '—'),
                                Placeholder::make('updated_at_display')
                                    ->label(__('Updated'))
                                    ->content(fn (?User $record): string => $record?->updated_at?->toDayDateTimeString() ?? '—'),
                                Placeholder::make('deleted_at_display')
                                    ->label(__('Deleted'))
                                    ->content(fn (?User $record): string => $record?->deleted_at?->toDayDateTimeString() ?? '—')
                                    ->visible(fn (?User $record): bool => $record?->trashed() === true),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
