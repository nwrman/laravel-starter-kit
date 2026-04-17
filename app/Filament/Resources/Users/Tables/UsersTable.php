<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Tables;

use App\Models\User;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\BulkAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\ToggleButtons;
use Filament\Support\Enums\FontWeight;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight(FontWeight::Medium),
                TextColumn::make('email')
                    ->searchable()
                    ->sortable()
                    ->copyable(),
                IconColumn::make('is_admin')
                    ->label(__('Admin'))
                    ->boolean(),
                IconColumn::make('email_verified_at')
                    ->label(__('Verified'))
                    ->boolean()
                    ->toggleable(),
                IconColumn::make('two_factor_confirmed_at')
                    ->label(__('2FA'))
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('last_login_at')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('—')
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TernaryFilter::make('is_admin')
                    ->label(__('Administrator')),
                TernaryFilter::make('email_verified')
                    ->label(__('Verified'))
                    ->queries(
                        true: fn (Builder $query) => $query->whereNotNull('email_verified_at'),
                        false: fn (Builder $query) => $query->whereNull('email_verified_at'),
                    ),
                TrashedFilter::make(),
            ])
            ->recordActions([
                ActionGroup::make([
                    ViewAction::make()
                        ->slideOver(),
                    EditAction::make(),
                    Action::make('toggle_admin')
                        ->icon(fn (User $record): Heroicon => $record->is_admin ? Heroicon::ShieldExclamation : Heroicon::ShieldCheck)
                        ->label(fn (User $record): string => $record->is_admin ? __('Remove admin') : __('Make admin'))
                        ->color(fn (User $record): string => $record->is_admin ? 'danger' : 'success')
                        ->requiresConfirmation()
                        ->action(fn (User $record) => $record->update(['is_admin' => ! $record->is_admin]))
                        ->hidden(fn (User $record): bool => auth()->user()?->is($record) === true),
                    DeleteAction::make()
                        ->after(function (User $record): void {
                            DB::table('sessions')->where('user_id', $record->id)->delete();
                        }),
                    RestoreAction::make(),
                    ForceDeleteAction::make(),
                ]),
            ])
            ->groupedBulkActions([
                BulkAction::make('toggle_admin')
                    ->icon(Heroicon::ShieldCheck)
                    ->schema([
                        ToggleButtons::make('is_admin')
                            ->options([
                                '1' => __('Admin'),
                                '0' => __('Regular'),
                            ])
                            ->inline()
                            ->required(),
                    ])
                    ->action(function (Collection $records, array $data): void {
                        $currentUserId = auth()->id();

                        $records
                            ->reject(fn (mixed $r): bool => $r instanceof User && $r->id === $currentUserId)
                            ->each(fn (mixed $r) => $r instanceof User ? $r->update(['is_admin' => (bool) $data['is_admin']]) : null);
                    })
                    ->deselectRecordsAfterCompletion(),
                DeleteBulkAction::make(),
                RestoreBulkAction::make(),
                ForceDeleteBulkAction::make(),
            ]);
    }
}
