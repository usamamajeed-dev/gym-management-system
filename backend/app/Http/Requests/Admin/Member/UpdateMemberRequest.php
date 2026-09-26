<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Member;

use App\Enums\Gender;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Concerns\NormalisesContactFields;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Profile fields only; status and activation change through the approval actions. */
class UpdateMemberRequest extends FormRequest
{
    use NormalisesContactFields;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore((int) $this->route('member')),
            ],
            'phone' => ['sometimes', 'required', 'string', 'max:20', 'regex:'.RegisterRequest::PHONE_REGEX],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today', 'after:1900-01-01'],
            'gender' => ['sometimes', 'nullable', Rule::enum(Gender::class)],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['sometimes', 'nullable', 'string', 'max:20', 'regex:'.RegisterRequest::PHONE_REGEX],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email already exists.',
            'phone.regex' => 'Enter the phone number in international format, e.g. +14155552671.',
            'emergency_contact_phone.regex' => 'Enter the phone number in international format, e.g. +14155552671.',
        ];
    }
}
