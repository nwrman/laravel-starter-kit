<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * Creates the first administrator on a deployed environment.
 *
 * Deliberately not a seeder: seeders carry demo data and depend on
 * `fakerphp/faker`, which is absent under `composer install --no-dev`. Running
 * one in production half-succeeds — the admin is created and the factory calls
 * then throw. `php artisan tinker` is not an option either, since psysh is also
 * a dev dependency.
 *
 * Takes every value as an option because commands on Laravel Cloud run
 * non-interactively:
 *
 *     cloud command:run PRD --cmd='php artisan app:create-admin --email=a@b.com --password=... --name="Jane"' -n
 */
#[Description('Create an administrator account on a deployed environment')]
#[Signature('app:create-admin
        {--email= : Email address for the administrator}
        {--password= : Password for the administrator}
        {--name=Administrator : Display name}
        {--force : Promote and reset the password if the email already exists}')]
final class CreateAdminCommand extends Command
{
    private const int MINIMUM_PASSWORD_LENGTH = 12;

    public function handle(): int
    {
        $email = $this->stringOption('email');
        $password = $this->stringOption('password');
        $name = $this->stringOption('name') ?? 'Administrator';

        if ($email === null || $password === null) {
            $this->error('Both --email and --password are required.');

            return self::FAILURE;
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => ['required', 'email'],
                'password' => ['required', 'string', 'min:'.self::MINIMUM_PASSWORD_LENGTH],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $existing = User::query()->where('email', $email)->first();

        if ($existing instanceof User && ! $this->option('force')) {
            $this->error("A user with {$email} already exists. Pass --force to promote and reset it.");

            return self::FAILURE;
        }

        if ($existing instanceof User) {
            $existing->forceFill([
                'password' => $password,
                'is_admin' => true,
                'email_verified_at' => $existing->email_verified_at ?? now(),
            ])->save();

            $this->info("Promoted {$email} to administrator and reset its password.");

            return self::SUCCESS;
        }

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'email_verified_at' => now(),
            'is_admin' => true,
        ]);

        // Never echo the password: Cloud captures and retains command output.
        $this->info("Created administrator {$email}.");

        return self::SUCCESS;
    }

    private function stringOption(string $key): ?string
    {
        $value = $this->option($key);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
