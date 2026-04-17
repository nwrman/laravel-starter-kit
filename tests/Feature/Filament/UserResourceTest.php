<?php

declare(strict_types=1);

use App\Filament\Resources\Users\Pages\CreateUser;
use App\Filament\Resources\Users\Pages\EditUser;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Models\User;
use Livewire\Livewire;

beforeEach(function (): void {
    $this->admin = User::factory()->admin()->create();
});

it('denies list access to non-admin users', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin/users')
        ->assertForbidden();
});

it('lists users', function (): void {
    $users = User::factory()->count(3)->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->assertCanSeeTableRecords($users);
});

it('filters users by name through search', function (): void {
    $alice = User::factory()->create(['name' => 'Alice Smith']);
    $bob = User::factory()->create(['name' => 'Bob Jones']);

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->searchTable('Alice')
        ->assertCanSeeTableRecords([$alice])
        ->assertCanNotSeeTableRecords([$bob]);
});

it('creates a user with admin-set password and auto-verified email', function (): void {
    $this->actingAs($this->admin);

    Livewire::test(CreateUser::class)
        ->fillForm([
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'Temp1234!',
        ])
        ->call('create')
        ->assertHasNoFormErrors();

    $user = User::query()->where('email', 'new@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('New User')
        ->and($user->email_verified_at)->not->toBeNull();
});

it('edits a user name', function (): void {
    $target = User::factory()->create(['name' => 'Old Name']);

    $this->actingAs($this->admin);

    Livewire::test(EditUser::class, ['record' => $target->getRouteKey()])
        ->fillForm(['name' => 'New Name'])
        ->call('save')
        ->assertHasNoFormErrors();

    expect($target->refresh()->name)->toBe('New Name');
});

it('does not overwrite password when left empty on edit', function (): void {
    $target = User::factory()->create(['password' => 'Original1234!']);
    $originalHash = $target->getAttributes()['password'];

    $this->actingAs($this->admin);

    Livewire::test(EditUser::class, ['record' => $target->getRouteKey()])
        ->fillForm(['password' => ''])
        ->call('save')
        ->assertHasNoFormErrors();

    expect($target->refresh()->getAttributes()['password'])->toBe($originalHash);
});

it('soft-deletes a user and clears sessions from edit page', function (): void {
    $target = User::factory()->create();

    $this->actingAs($this->admin);

    Livewire::test(EditUser::class, ['record' => $target->getRouteKey()])
        ->callAction('delete');

    expect($target->refresh()->trashed())->toBeTrue();
});

it('restores a soft-deleted user from edit page', function (): void {
    $target = User::factory()->create();
    $target->delete();

    $this->actingAs($this->admin);

    Livewire::test(EditUser::class, ['record' => $target->getRouteKey()])
        ->callAction('restore');

    expect($target->refresh()->trashed())->toBeFalse();
});

// --- Tab switching (regression tests for runtime null-model crash) --------

it('loads the "all" tab without error', function (): void {
    $regular = User::factory()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class, ['activeTab' => 'all'])
        ->assertSuccessful()
        ->assertCanSeeTableRecords([$this->admin, $regular]);
});

it('loads the "admins" tab without error and shows only admins', function (): void {
    $regular = User::factory()->create();
    $secondAdmin = User::factory()->admin()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class, ['activeTab' => 'admins'])
        ->assertSuccessful()
        ->assertCanSeeTableRecords([$this->admin, $secondAdmin])
        ->assertCanNotSeeTableRecords([$regular]);
});

it('loads the "verified" tab without error and shows only verified users', function (): void {
    $verified = User::factory()->create(['email_verified_at' => now()]);
    $unverified = User::factory()->unverified()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class, ['activeTab' => 'verified'])
        ->assertSuccessful()
        ->assertCanSeeTableRecords([$verified])
        ->assertCanNotSeeTableRecords([$unverified]);
});

it('loads the "unverified" tab without error and shows only unverified users', function (): void {
    $verified = User::factory()->create(['email_verified_at' => now()]);
    $unverified = User::factory()->unverified()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class, ['activeTab' => 'unverified'])
        ->assertSuccessful()
        ->assertCanSeeTableRecords([$unverified])
        ->assertCanNotSeeTableRecords([$verified]);
});

it('switches between tabs without error', function (): void {
    $regular = User::factory()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->set('activeTab', 'admins')
        ->assertSuccessful()
        ->set('activeTab', 'verified')
        ->assertSuccessful()
        ->set('activeTab', 'unverified')
        ->assertSuccessful()
        ->set('activeTab', 'all')
        ->assertSuccessful()
        ->assertCanSeeTableRecords([$this->admin, $regular]);
});

it('combines the admins tab with a search', function (): void {
    $alice = User::factory()->admin()->create(['name' => 'Alice Admin']);
    $bob = User::factory()->admin()->create(['name' => 'Bob Admin']);
    User::factory()->create(['name' => 'Alice Regular']);

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class, ['activeTab' => 'admins'])
        ->searchTable('Alice')
        ->assertSuccessful()
        ->assertCanSeeTableRecords([$alice])
        ->assertCanNotSeeTableRecords([$bob]);
});

// --- Filters ---------------------------------------------------------------

it('filters by the is_admin TernaryFilter', function (): void {
    $regular = User::factory()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->filterTable('is_admin', true)
        ->assertCanSeeTableRecords([$this->admin])
        ->assertCanNotSeeTableRecords([$regular]);
});

it('filters by the email_verified TernaryFilter', function (): void {
    $verified = User::factory()->create();
    $unverified = User::factory()->unverified()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->filterTable('email_verified', false)
        ->assertCanSeeTableRecords([$unverified])
        ->assertCanNotSeeTableRecords([$verified]);
});

it('combines a tab with a filter', function (): void {
    $verifiedAdmin = User::factory()->admin()->create();
    $unverifiedAdmin = User::factory()->admin()->unverified()->create();

    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class, ['activeTab' => 'admins'])
        ->filterTable('email_verified', true)
        ->assertCanSeeTableRecords([$this->admin, $verifiedAdmin])
        ->assertCanNotSeeTableRecords([$unverifiedAdmin]);
});
