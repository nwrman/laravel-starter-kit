<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

final class DatabaseSeeder extends Seeder
{
    /**
     * Seed demo data for local development.
     *
     * Development only, and it refuses to run anywhere else. The factory calls
     * below need `fakerphp/faker`, a dev dependency, so under
     * `composer install --no-dev` this used to create the admin and *then* throw
     * `undefined function fake()` — leaving a half-seeded database and a non-zero
     * exit. The admin password here is a known literal for the same reason.
     *
     * To create an administrator on a deployed environment, use
     * `php artisan app:create-admin` instead.
     */
    public function run(): void
    {
        throw_unless(
            app()->environment('local', 'testing'),
            RuntimeException::class,
            'DatabaseSeeder seeds demo data and is for local development only. '
            .'Use `php artisan app:create-admin` to create an administrator.'
        );

        User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'email_verified_at' => now(),
                'password' => 'Password1234!',
                'is_admin' => true,
            ],
        );

        User::factory()->count(10)->create();
        User::factory()->unverified()->count(3)->create();
        User::factory()->trashed()->count(2)->create();
    }
}
