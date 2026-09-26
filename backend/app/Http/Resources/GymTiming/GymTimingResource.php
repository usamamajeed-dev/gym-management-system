<?php

declare(strict_types=1);

namespace App\Http\Resources\GymTiming;

use App\Models\GymTiming;
use App\Support\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GymTiming */
class GymTimingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'day_of_week' => $this->day_of_week,
            'day_name' => $this->dayName(),
            'is_closed' => $this->is_closed,
            'opens_at' => $this->opens_at !== null ? substr($this->opens_at, 0, 5) : null,
            'closes_at' => $this->closes_at !== null ? substr($this->closes_at, 0, 5) : null,
            'updated_at' => DateFormat::iso($this->updated_at),
        ];
    }
}
