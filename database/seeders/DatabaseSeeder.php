<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'email_verified_at' => now(),
                'password' => 'Password1234!',
                'is_admin' => true,
            ],
        );

        // Demo users for back-office panel
        User::factory()->count(10)->create();
        User::factory()->unverified()->count(3)->create();
        User::factory()->trashed()->count(2)->create();
    }
}
