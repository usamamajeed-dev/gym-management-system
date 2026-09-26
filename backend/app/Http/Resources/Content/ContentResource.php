<?php

declare(strict_types=1);

namespace App\Http\Resources\Content;

use App\Models\Content;
use App\Support\DateFormat;
use Illuminate\Http\Request;

/**
 * Full shape for detail views: the list fields plus body and updated_at.
 *
 * @mixin Content
 */
class ContentResource extends ContentListResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'body' => $this->body,
            'updated_at' => DateFormat::iso($this->updated_at),
        ];
    }
}
