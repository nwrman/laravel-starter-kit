<?php

declare(strict_types=1);

use App\Concerns\PasswordValidationRules;
use Illuminate\Validation\Rules\Password;

beforeEach(function (): void {
    $this->trait = new class
    {
        use PasswordValidationRules {
            passwordRules as public;
            currentPasswordRules as public;
        }
    };
});

it('returns password rules including required, confirmed, and default Password rule', function (): void {
    $rules = $this->trait->passwordRules();

    expect($rules)->toContain('required');
    expect($rules)->toContain('confirmed');
    expect(array_filter($rules, fn ($rule): bool => $rule instanceof Password))->not->toBeEmpty();
});

it('returns current password rules with required and current_password', function (): void {
    $rules = $this->trait->currentPasswordRules();

    expect($rules)->toBe(['required', 'current_password']);
});
