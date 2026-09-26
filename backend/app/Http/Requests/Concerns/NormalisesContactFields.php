<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

/**
 * Lowercases/trims the email and keeps only digits and "+" in phone numbers,
 * so "+1 (415) 555-2671" is validated and stored as "+14155552671".
 */
trait NormalisesContactFields
{
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
}
