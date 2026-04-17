<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use App\Models\User;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\DB;

final class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    /**
     * @return array<int, DeleteAction|RestoreAction|ForceDeleteAction>
     */
    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make()
                ->after(function (User $record): void {
                    DB::table('sessions')->where('user_id', $record->id)->delete();
                }),
            RestoreAction::make(),
            ForceDeleteAction::make(),
        ];
    }
}
