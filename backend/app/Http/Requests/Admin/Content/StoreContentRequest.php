<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Content;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Support\HtmlSanitizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Multipart when an image is attached. New items start as draft unless status=published. */
class StoreContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('body'))) {
            $this->merge(['body' => HtmlSanitizer::clean($this->input('body'))]);
        }
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ContentType::class)],
            'title' => ['required', 'string', 'max:200'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string', 'max:65000'],
            'status' => ['sometimes', Rule::in([ContentStatus::DRAFT->value, ContentStatus::PUBLISHED->value])],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'New content can be saved as draft or published.',
        ];
    }
}
