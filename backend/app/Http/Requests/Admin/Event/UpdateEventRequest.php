<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Event;

use App\Models\Event;
use App\Support\DateFormat;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Throwable;

/**
 * Partial update: every field is optional. Sent as multipart POST with _method=PUT
 * when an image is attached.
 */
class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_type_id' => ['sometimes', 'required', 'integer', Rule::exists('event_types', 'id')->where('is_active', true)],
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:150'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return (new StoreEventRequest)->messages();
    }

    /** ends_at must not be before starts_at, using the stored start when only the end is sent. */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['starts_at', 'ends_at']) || $this->input('ends_at') === null) {
                    return;
                }

                /** @var Event|null $event */
                $event = $this->route('event');
                $startsAt = $this->filled('starts_at')
                    ? $this->parse($this->input('starts_at'))
                    : $event?->starts_at;
                $endsAt = $this->parse($this->input('ends_at'));

                if ($startsAt !== null && $endsAt !== null && $endsAt->lt($startsAt)) {
                    $validator->errors()->add('ends_at', $this->messages()['ends_at.after_or_equal']);
                }
            },
        ];
    }

    private function parse(mixed $value): ?Carbon
    {
        try {
            return is_string($value) ? Carbon::parse($value, DateFormat::timezone()) : null;
        } catch (Throwable) {
            return null;
        }
    }
}
