<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Event;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Multipart when an image is attached. Dates are local gym time or ISO-8601 with offset. */
class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_type_id' => ['required', 'integer', Rule::exists('event_types', 'id')->where('is_active', true)],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:150'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'event_type_id.exists' => 'Choose an active event type.',
            'ends_at.after_or_equal' => 'The end time must be the same as or after the start time.',
        ];
    }
}
