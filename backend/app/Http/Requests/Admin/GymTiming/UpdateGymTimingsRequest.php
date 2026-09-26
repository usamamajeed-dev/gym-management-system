<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\GymTiming;

use App\Models\GymTiming;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/** The whole week in one request: exactly seven rows, one per day. */
class UpdateGymTimingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'timings' => ['required', 'array', 'size:7'],
            'timings.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'timings.*.is_closed' => ['required', 'boolean'],
            'timings.*.opens_at' => ['required_if:timings.*.is_closed,false', 'nullable', 'date_format:H:i'],
            'timings.*.closes_at' => ['required_if:timings.*.is_closed,false', 'nullable', 'date_format:H:i'],
        ];
    }

    public function messages(): array
    {
        return [
            'timings.size' => 'Provide opening hours for all 7 days.',
            'timings.*.day_of_week.distinct' => 'Each day can appear only once.',
            'timings.*.opens_at.required_if' => 'Opening time is required when the day is open.',
            'timings.*.closes_at.required_if' => 'Closing time is required when the day is open.',
        ];
    }

    /** Compare each open day's times directly; the "after:" rule is unreliable across wildcard siblings. */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ((array) $this->input('timings', []) as $index => $timing) {
                    if (! is_array($timing) || filter_var($timing['is_closed'] ?? null, FILTER_VALIDATE_BOOLEAN)) {
                        continue;
                    }

                    $opens = $timing['opens_at'] ?? null;
                    $closes = $timing['closes_at'] ?? null;

                    if (! $this->isTime($opens) || ! $this->isTime($closes) || $closes > $opens) {
                        continue;
                    }

                    $day = GymTiming::DAY_NAMES[(int) ($timing['day_of_week'] ?? -1)] ?? 'this day';
                    $validator->errors()->add(
                        "timings.{$index}.closes_at",
                        "Closing time must be after opening time for {$day}.",
                    );
                }
            },
        ];
    }

    private function isTime(mixed $value): bool
    {
        return is_string($value) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value) === 1;
    }
}
