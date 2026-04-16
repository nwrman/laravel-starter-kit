<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake('public');
});

it('can delete their profile photo', function (): void {
    $user = User::factory()->create();
    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    expect($user->getFirstMedia('photo'))->not->toBeNull();

    $response = $this->actingAs($user)
        ->fromRoute('user-profile.edit')
        ->delete(route('user-photo.destroy'));

    $response->assertRedirectToRoute('user-profile.edit');

    expect($user->refresh()->getFirstMedia('photo'))->toBeNull();
});

it('does not error when deleting photo with none set', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('user-profile.edit')
        ->delete(route('user-photo.destroy'));

    $response->assertRedirectToRoute('user-profile.edit');
});

it('flashes success message when deleting photo', function (): void {
    $user = User::factory()->create();
    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('photo');

    $response = $this->actingAs($user)
        ->fromRoute('user-profile.edit')
        ->delete(route('user-photo.destroy'));

    $response->assertRedirectToRoute('user-profile.edit')
        ->assertInertiaFlash('success', 'Foto de perfil eliminada');
});

it('requires authentication to delete photo', function (): void {
    $response = $this->delete(route('user-photo.destroy'));

    $response->assertRedirect(route('login'));
});
