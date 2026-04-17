<?php

declare(strict_types=1);

use App\Models\User;

it('redirects guests to the admin login page', function (): void {
    $this->get('/admin')
        ->assertRedirect('/admin/login');
});

it('denies access to authenticated non-admin users', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin')
        ->assertForbidden();
});

it('grants access to admin users', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/admin')
        ->assertOk();
});
