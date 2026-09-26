<?php

declare(strict_types=1);

namespace App\Http\Resources\Event;

use App\Http\Resources\EventType\EventTypeOptionResource;
use App\Models\Event;
use App\Support\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Event */
class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'capacity' => $this->capacity,
            'is_published' => $this->is_published,
            'event_type' => new EventTypeOptionResource($this->whenLoaded('eventType')),
            'starts_at' => DateFormat::iso($this->starts_at),
            'ends_at' => DateFormat::iso($this->ends_at),
            'image_url' => $this->image_path !== null ? Storage::disk('public')->url($this->image_path) : null,
            'created_at' => DateFormat::iso($this->created_at),
            'updated_at' => DateFormat::iso($this->updated_at),
            'created_by' => $this->when(
                $this->relationLoaded('createdBy') && (bool) $request->user()?->isAdmin(),
                fn () => $this->createdBy ? ['id' => $this->createdBy->id, 'name' => $this->createdBy->name] : null,
            ),
        ];
    }
}
