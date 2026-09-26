<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\EventType;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventTypeRequest extends FormRequest
{
    public const COLOR_REGEX = '/^#[0-9A-Fa-f]{6}$/';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => trim($this->input('name'))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:event_types,name'],
            'color' => ['required', 'string', 'regex:'.self::COLOR_REGEX],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'An event type with this name already exists.',
            'color.regex' => 'The colour must be a hex value such as #FF5722.',
        ];
    }
}
