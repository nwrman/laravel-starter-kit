<?php

declare(strict_types=1);

use App\Actions\DeleteUser;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('deletes the user', function (): void {
    $user = User::factory()->create();

    resolve(DeleteUser::class)->handle($user);

    expect(User::query()->find($user->id))->toBeNull();
});

it('clears the photo media collection', function (): void {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    expect($user->getFirstMedia('photo'))->not->toBeNull();

    resolve(DeleteUser::class)->handle($user);

    expect(User::query()->find($user->id))->toBeNull();
});
