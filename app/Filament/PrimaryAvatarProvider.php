<?php

declare(strict_types=1);

namespace App\Filament;

use Filament\AvatarProviders\Contracts\AvatarProvider;
use Filament\Facades\Filament;
use Filament\Support\Colors\Color;
use Filament\Support\Facades\FilamentColor;
use Illuminate\Database\Eloquent\Model;

/**
 * Avatar provider that uses the primary color instead of gray
 * for the avatar background, keeping it in sync with the brand.
 */
final class PrimaryAvatarProvider implements AvatarProvider
{
    public function get(Model $record): string
    {
        $name = str(Filament::getNameForDefaultAvatar($record))
            ->trim()
            ->explode(' ')
            ->map(fn (string $segment): string => filled($segment) ? mb_substr($segment, 0, 1) : '')
            ->join(' ');

        $background = Color::convertToHex((string) (FilamentColor::getColor('primary')[600] ?? Color::Amber[600]));
        $foreground = Color::convertToHex((string) (FilamentColor::getColor('primary')[50] ?? Color::Amber[50]));

        return 'https://ui-avatars.com/api/?name='.urlencode($name).'&format=svg&color='.urlencode($foreground).'&background='.urlencode($background);
    }
}
