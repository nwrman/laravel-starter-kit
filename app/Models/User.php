<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * @property-read string $id
 * @property-read string $name
 * @property-read string $email
 * @property-read CarbonInterface|null $email_verified_at
 * @property-read string $password
 * @property-read string|null $remember_token
 * @property-read string|null $two_factor_secret
 * @property-read string|null $two_factor_recovery_codes
 * @property-read CarbonInterface|null $two_factor_confirmed_at
 * @property-read bool $is_admin
 * @property-read CarbonInterface|null $last_login_at
 * @property-read string|null $photo_url
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read CarbonInterface|null $deleted_at
 */
#[Hidden([
    'password',
    'remember_token',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'media',
])]
#[Appends([
    'photo_url',
])]
final class User extends Authenticatable implements FilamentUser, HasMedia, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use HasUlids;
    use InteractsWithMedia;
    use Notifiable;
    use SoftDeletes;
    use TwoFactorAuthenticatable;

    /**
     * Prefix used to "park" a soft-deleted user's email so the unique
     * constraint frees up for re-registration. Restoration reverses it.
     */
    public const string TRASHED_EMAIL_PREFIX = '__trashed+';

    public const string TRASHED_EMAIL_DOMAIN = '@deleted.local';

    /**
     * @return array<string, string>
     */
    public function casts(): array
    {
        return [
            'id' => 'string',
            'name' => 'string',
            'email' => 'string',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'remember_token' => 'string',
            'two_factor_secret' => 'string',
            'two_factor_recovery_codes' => 'string',
            'two_factor_confirmed_at' => 'datetime',
            'is_admin' => 'boolean',
            'last_login_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        if ($this->trashed()) {
            return false;
        }

        return $this->is_admin;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp'])
            ->registerMediaConversions(function (Media $media): void {
                $this->addMediaConversion('thumb')
                    ->width(128)
                    ->height(128);
            });
    }

    /**
     * Register model event hooks to free the email on soft-delete and
     * restore it on restore, so the users.email unique index stays usable.
     */
    protected static function booted(): void
    {
        self::deleting(function (self $user): void {
            if ($user->isForceDeleting()) {
                return;
            }

            if (str_starts_with($user->email, self::TRASHED_EMAIL_PREFIX)) {
                return;
            }

            $user->forceFill([
                'email' => self::TRASHED_EMAIL_PREFIX.$user->id.'+'.$user->email.self::TRASHED_EMAIL_DOMAIN,
            ])->saveQuietly();
        });

        self::restoring(function (self $user): void {
            if (! str_starts_with($user->email, self::TRASHED_EMAIL_PREFIX)) {
                return;
            }

            $withoutPrefix = mb_substr($user->email, mb_strlen(self::TRASHED_EMAIL_PREFIX));

            $idPlusOriginal = str_ends_with($withoutPrefix, self::TRASHED_EMAIL_DOMAIN)
                ? mb_substr($withoutPrefix, 0, -mb_strlen(self::TRASHED_EMAIL_DOMAIN))
                : $withoutPrefix;

            $plusIndex = mb_strpos($idPlusOriginal, '+');
            $original = $plusIndex === false ? $idPlusOriginal : mb_substr($idPlusOriginal, $plusIndex + 1);

            $user->forceFill(['email' => $original])->saveQuietly();
        });
    }

    /** @return Attribute<non-empty-string|null, never> */
    protected function photoUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            $url = $this->getFirstMediaUrl('photo', 'thumb');

            if ($url === '') {
                return null;
            }

            return $url;
        });
    }
}
