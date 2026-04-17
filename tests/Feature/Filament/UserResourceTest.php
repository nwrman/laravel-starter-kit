<?php

declare(strict_types=1);

use App\Filament\Resources\Users\Pages\ListUsers;
use App\Filament\Resources\Users\Pages\ViewUser;
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

it('renders the view page for a user', function (): void {
    $target = User::factory()->create();

    $this->actingAs($this->admin);

    Livewire::test(ViewUser::class, ['record' => $target->getRouteKey()])
        ->assertSuccessful()
        ->assertSee($target->name)
        ->assertSee($target->email);
});
