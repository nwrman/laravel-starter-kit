<?php

declare(strict_types=1);

use App\Models\User;

it('can navigate to the admins tab without error', function (): void {
    $admin = User::factory()->admin()->create([
        'password' => 'password',
    ]);

    $this->actingAs($admin);

    $page = visitWithoutAnimations('/admin/users?activeTab=admins');

    $page->assertSee($admin->name)
        ->assertDontSee('Internal Server Error')
        ->assertNoJavaScriptErrors();
});
