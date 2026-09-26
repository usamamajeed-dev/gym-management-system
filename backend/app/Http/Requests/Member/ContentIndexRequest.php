<?php

declare(strict_types=1);

namespace App\Http\Requests\Member;

use App\Enums\ContentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ContentType::class)],
            'period' => ['nullable', Rule::in(['current', 'archive'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function type(): ContentType
    {
        return ContentType::from($this->validated('type'));
    }

    /** "current" (published) or "archive" (archived). */
    public function period(): string
    {
        return $this->validated('period') ?? 'current';
    }
}
