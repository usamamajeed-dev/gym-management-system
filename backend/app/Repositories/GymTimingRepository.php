<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\GymTiming;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class GymTimingRepository extends BaseRepository
{
    public function model(): string
    {
        return GymTiming::class;
    }

    /** All seven days, Monday first. */
    public function week(): Collection
    {
        return $this->query()->orderByRaw('(day_of_week + 6) % 7')->get();
    }

    public function forDay(int $dayOfWeek): ?GymTiming
    {
        /** @var GymTiming|null */
        return $this->query()->where('day_of_week', $dayOfWeek)->first();
    }
}
