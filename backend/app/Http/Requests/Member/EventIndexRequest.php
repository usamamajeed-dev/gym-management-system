<?php

declare(strict_types=1);

namespace App\Http\Requests\Member;

use App\Support\DateFormat;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class EventIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month' => ['nullable', 'date_format:Y-m'],
        ];
    }

    public function messages(): array
    {
        return [
            'month.date_format' => 'The month must be in YYYY-MM format, e.g. 2026-10.',
        ];
    }

    /** First day of the requested month in gym time; the current month by default. */
    public function month(): CarbonImmutable
    {
        $month = $this->validated('month');

        return $month !== null
            ? CarbonImmutable::createFromFormat('!Y-m', $month, DateFormat::timezone())
            : CarbonImmutable::now(DateFormat::timezone())->startOfMonth();
    }
}
