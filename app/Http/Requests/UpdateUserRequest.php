<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateUserRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $user = $this->user();
        assert($user instanceof User);

        return [
            ...$this->profileRules($user->id),
            'photo' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
