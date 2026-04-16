<?php

declare(strict_types=1);

use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Rules\ValidEmail;
use Illuminate\Validation\Rules\Unique;

beforeEach(function (): void {
    $this->trait = new class
    {
        use ProfileValidationRules {
            profileRules as public;
            nameRules as public;
            emailRules as public;
        }
    };
});

it('returns profile rules keyed by name and email', function (): void {
    $rules = $this->trait->profileRules();

    expect($rules)->toHaveKeys(['name', 'email']);
});

it('returns name rules with required, string, and max:255', function (): void {
    expect($this->trait->nameRules())->toBe(['required', 'string', 'max:255']);
});

it('returns email rules including ValidEmail and unique constraint on User', function (): void {
    $rules = $this->trait->emailRules();

    expect($rules)->toContain('required');
    expect($rules)->toContain('string');
    expect($rules)->toContain('lowercase');
    expect($rules)->toContain('max:255');
    expect($rules)->toContain('email');

    $hasValidEmail = array_filter($rules, fn ($rule): bool => $rule instanceof ValidEmail) !== [];
    expect($hasValidEmail)->toBeTrue();

    $uniques = array_filter($rules, fn ($rule): bool => $rule instanceof Unique);
    expect($uniques)->toHaveCount(1);
});

it('ignores a specific user id when provided', function (): void {
    $user = User::factory()->create();

    $rules = $this->trait->emailRules($user->id);

    $uniques = array_values(array_filter($rules, fn ($rule): bool => $rule instanceof Unique));
    expect($uniques)->toHaveCount(1);
    // The Unique rule converts to a string like "unique:users,NULL,<id>,id"
    expect((string) $uniques[0])->toContain($user->id);
});
