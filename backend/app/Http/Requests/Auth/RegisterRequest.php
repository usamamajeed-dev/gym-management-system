<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    /** International phone in E.164 format, e.g. +14155552671. */
    public const PHONE_REGEX = '/^\+[1-9]\d{6,14}$/';

    /** At least one lowercase letter, one uppercase letter, one digit and one special character. */
    public const PASSWORD_REGEX = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/';

    public function authorize(): bool
    {
        return true;
    }

    /** Normalise before validation: lowercase email, keep only digits and "+" in phone numbers. */
    protected function prepareForValidation(): void
    {
        $normalised = [];

        if (is_string($this->input('email'))) {
            $normalised['email'] = strtolower(trim($this->input('email')));
        }

        foreach (['phone', 'emergency_contact_phone'] as $field) {
            if (is_string($this->input($field)) && $this->input($field) !== '') {
                $normalised[$field] = preg_replace('/[^\d+]/', '', $this->input($field));
            }
        }

        $this->merge($normalised);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'max:20', 'regex:'.self::PHONE_REGEX],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:'.self::PASSWORD_REGEX],
            'date_of_birth' => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'gender' => ['nullable', Rule::enum(Gender::class)],
            'address' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20', 'regex:'.self::PHONE_REGEX],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email already exists.',
            'phone.regex' => 'Enter the phone number in international format, e.g. +14155552671.',
            'emergency_contact_phone.regex' => 'Enter the phone number in international format, e.g. +14155552671.',
            'password.regex' => 'The password must contain an uppercase letter, a lowercase letter, a number and a special character.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
