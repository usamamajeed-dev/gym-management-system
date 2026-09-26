<?php

declare(strict_types=1);

namespace App\Http\Resources\EventType;

use App\Models\EventType;
use App\Support\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin EventType */
class EventTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'color' => $this->color,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'events_count' => $this->whenCounted('events'),
            'created_at' => DateFormat::iso($this->created_at),
            'updated_at' => DateFormat::iso($this->updated_at),
        ];
    }
}
