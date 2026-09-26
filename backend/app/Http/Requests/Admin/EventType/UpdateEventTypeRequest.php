<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\EventType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventTypeRequest extends FormRequest
{
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
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('event_types', 'name')->ignore($this->route('eventType')),
            ],
            'color' => ['sometimes', 'required', 'string', 'regex:'.StoreEventTypeRequest::COLOR_REGEX],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return (new StoreEventTypeRequest)->messages();
    }
}
