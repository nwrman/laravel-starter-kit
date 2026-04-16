<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Laravel\Fortify\InteractsWithTwoFactorState;

final class TwoFactorAuthenticationRequest extends FormRequest
{
    use InteractsWithTwoFactorState;

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
