<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Content;

use App\Support\HtmlSanitizer;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Partial update of text and image. "type" and "status" have no rules, so they are
 * never part of validated(): the type is fixed after creation, and status changes
 * only through the publish/archive actions.
 */
class UpdateContentRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:500'],
            'body' => ['sometimes', 'required', 'string', 'max:65000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}
