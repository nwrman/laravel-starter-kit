<?php

declare(strict_types=1);

use App\Filament\Resources\Users\Pages\EditUser;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Models\User;
use Livewire\Livewire;

beforeEach(function (): void {
    $this->admin = User::factory()->admin()->create();
});

it('renders list page column headers in spanish', function (): void {
    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->assertSee('Nombre')
        ->assertSee('Correo')
        ->assertDontSee('>Name<');
});

it('renders tab labels in spanish', function (): void {
    $this->actingAs($this->admin);

    Livewire::test(ListUsers::class)
        ->assertSee('Todos')
        ->assertSee('Administradores')
        ->assertSee('Verificado')
        ->assertSee('Sin verificar');
});

it('translates stat widget titles to spanish', function (): void {
    expect(__('Total Users'))->toBe('Usuarios')
        ->and(__('Admins'))->toBe('Administradores')
        ->and(__('New this week'))->toBe('Nuevos esta semana')
        ->and(__('Active 24h'))->toBe('Activos 24h');
});

it('renders edit form tabs in spanish', function (): void {
    $target = User::factory()->create();

    $this->actingAs($this->admin);

    Livewire::test(EditUser::class, ['record' => $target->getRouteKey()])
        ->assertSee('Personal')
        ->assertSee('Seguridad')
        ->assertSee('Metadatos');
});

it('renders the navigation label in spanish', function (): void {
    $this->actingAs($this->admin)
        ->get('/admin/users')
        ->assertSee('Usuarios');
});
