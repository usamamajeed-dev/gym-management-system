<?php

declare(strict_types=1);

namespace App\Http\Resources\EventType;

use App\Models\EventType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact shape for dropdowns and badges: { value, title, color }.
 *
 * @mixin EventType
 */
class EventTypeOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'value' => $this->id,
            'title' => $this->name,
            'color' => $this->color,
        ];
    }
}
