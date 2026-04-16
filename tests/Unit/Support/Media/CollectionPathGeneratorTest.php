<?php

declare(strict_types=1);

use App\Models\User;
use App\Support\Media\CollectionPathGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

beforeEach(function (): void {
    Storage::fake('public');
});

test('generates model-centric path for known model', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    $media = $user->refresh()->getFirstMedia('photo');
    $generator = new CollectionPathGenerator();

    $expected = sprintf('users/%s/photo/%s/', $user->id, $media->id);

    expect($generator->getPath($media))->toBe($expected);
});

test('generates conversions path under model-centric structure', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    $media = $user->refresh()->getFirstMedia('photo');
    $generator = new CollectionPathGenerator();

    $expected = sprintf('users/%s/photo/%s/conversions/', $user->id, $media->id);

    expect($generator->getPathForConversions($media))->toBe($expected);
});

test('generates responsive images path under model-centric structure', function (): void {
    $user = User::factory()->create();

    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    $media = $user->refresh()->getFirstMedia('photo');
    $generator = new CollectionPathGenerator();

    $expected = sprintf('users/%s/photo/%s/responsive-images/', $user->id, $media->id);

    expect($generator->getPathForResponsiveImages($media))->toBe($expected);
});

test('falls back to kebab-cased plural model name for unknown models', function (): void {
    $generator = new CollectionPathGenerator();

    $media = new Media();
    $media->model_type = 'App\\Models\\SupportCase';
    $media->model_id = 'test-id';
    $media->collection_name = 'document';
    $media->id = 42;

    expect($generator->getPath($media))->toBe('support-cases/test-id/document/42/');
});
