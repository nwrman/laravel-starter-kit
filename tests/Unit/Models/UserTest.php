<?php

declare(strict_types=1);

use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileUnacceptableForCollection;

beforeEach(function (): void {
    Storage::fake('public');
});

test('to array', function (): void {
    $user = User::factory()->create()->refresh();

    expect(array_keys($user->toArray()))
        ->toBe([
            'id',
            'name',
            'email',
            'email_verified_at',
            'two_factor_confirmed_at',
            'is_admin',
            'last_login_at',
            'created_at',
            'updated_at',
            'deleted_at',
            'photo_url',
        ]);
});

test('is_admin defaults to false', function (): void {
    $user = User::factory()->create();

    expect($user->is_admin)->toBeFalse();
});

test('is_admin is cast to boolean', function (): void {
    $user = User::factory()->admin()->create();

    expect($user->is_admin)->toBeTrue();
});

test('canAccessPanel returns false for non-admin', function (): void {
    $user = User::factory()->create();
    $panel = Filament::getPanel('admin');

    expect($user->canAccessPanel($panel))->toBeFalse();
});

test('canAccessPanel returns true for admin', function (): void {
    $user = User::factory()->admin()->create();
    $panel = Filament::getPanel('admin');

    expect($user->canAccessPanel($panel))->toBeTrue();
});

test('canAccessPanel returns false for trashed admin', function (): void {
    $user = User::factory()->admin()->trashed()->create();
    $panel = Filament::getPanel('admin');

    expect($user->canAccessPanel($panel))->toBeFalse();
});

test('soft delete frees the email for re-use', function (): void {
    $user = User::factory()->create(['email' => 'alice@example.com']);
    $user->delete();

    expect($user->refresh()->email)
        ->toStartWith(User::TRASHED_EMAIL_PREFIX)
        ->toEndWith(User::TRASHED_EMAIL_DOMAIN);

    // The original email is now available for a new user.
    $newUser = User::factory()->create(['email' => 'alice@example.com']);
    expect($newUser->email)->toBe('alice@example.com');
});

test('restore recovers the original email', function (): void {
    $user = User::factory()->create(['email' => 'bob@example.com']);
    $user->delete();
    $user->restore();

    expect($user->refresh()->email)->toBe('bob@example.com');
});

test('force delete does not mutate email', function (): void {
    $user = User::factory()->create(['email' => 'charlie@example.com']);
    $user->forceDelete();

    expect(User::withTrashed()->find($user->id))->toBeNull();
});

test('trashed factory state produces deleted_at', function (): void {
    $user = User::factory()->trashed()->create();

    expect($user->trashed())->toBeTrue();
});

test('photo_url is null when no photo is uploaded', function (): void {
    $user = User::factory()->create();

    expect($user->photo_url)->toBeNull();
});

test('photo_url returns URL when photo is uploaded', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    expect($user->refresh()->photo_url)->toBeString()->not->toBeEmpty();
});

test('photo is stored in model-centric path structure', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    $media = $user->refresh()->getFirstMedia('photo');
    $expectedPrefix = sprintf('users/%s/photo/%s/', $user->id, $media->id);

    expect($media->getPath())->toContain($expectedPrefix);
});

test('photo thumb conversion is generated synchronously', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    $media = $user->refresh()->getFirstMedia('photo');

    expect($media->generated_conversions)->toHaveKey('thumb')
        ->and($media->generated_conversions['thumb'])->toBeTrue()
        ->and(file_exists($media->getPath('thumb')))->toBeTrue();
});

test('photo media collection is registered as single file', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('first.jpg'))
        ->toMediaCollection('photo');

    $user->addMedia(UploadedFile::fake()->image('second.jpg'))
        ->toMediaCollection('photo');

    expect($user->refresh()->getMedia('photo'))->toHaveCount(1);
});

test('photo media collection only accepts image mime types', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'))
        ->toMediaCollection('photo');
})->throws(FileUnacceptableForCollection::class);
