<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Base\BaseModel;

/**
 * Opening hours for one weekday. day_of_week follows Carbon: 0 = Sunday … 6 = Saturday.
 * opens_at / closes_at are wall-clock times in the gym's timezone ("06:00:00"), never converted.
 */
class GymTiming extends BaseModel
{
    public const DAY_NAMES = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    protected $fillable = [
        'day_of_week',
        'opens_at',
        'closes_at',
        'is_closed',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_closed' => 'boolean',
        ];
    }

    public function dayName(): string
    {
        return self::DAY_NAMES[$this->day_of_week];
    }
}
