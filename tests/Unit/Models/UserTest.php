<?php

declare(strict_types=1);

use App\Models\User;
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
            'last_login_at',
            'created_at',
            'updated_at',
            'photo_url',
        ]);
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
