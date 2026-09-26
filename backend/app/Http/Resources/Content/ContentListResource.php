<?php

declare(strict_types=1);

namespace App\Http\Resources\Content;

use App\Models\Content;
use App\Support\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * List shape: everything except the body. The excerpt falls back to the start of the body.
 *
 * @mixin Content
 */
class ContentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt ?: Str::limit(trim(strip_tags((string) $this->body)), 160),
            'image_url' => $this->image_path !== null ? Storage::disk('public')->url($this->image_path) : null,
            'status' => $this->status->value,
            'published_at' => DateFormat::iso($this->published_at),
            'archived_at' => DateFormat::iso($this->archived_at),
            'created_at' => DateFormat::iso($this->created_at),
        ];
    }
}
