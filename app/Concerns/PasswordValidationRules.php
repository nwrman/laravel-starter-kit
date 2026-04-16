<?php

declare(strict_types=1);

namespace App\Concerns;

use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate new passwords.
     *
     * @return array<int, mixed>
     */
    protected function passwordRules(): array
    {
        return ['required', 'confirmed', Password::defaults()];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'current_password'];
    }
}
