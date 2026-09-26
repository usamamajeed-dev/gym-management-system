<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\GymTiming;
use App\Repositories\GymTimingRepository;
use App\Services\Admin\AdminDashboardService;
use App\Services\Base\BaseService;
use App\Support\DateFormat;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Weekly opening hours and the shared "is the gym open right now?" check.
 * Times are wall-clock times in the gym's timezone; no overnight opening.
 */
class GymTimingService extends BaseService
{
    public function __construct(private GymTimingRepository $gymTimingRepository)
    {
        parent::__construct($this->gymTimingRepository);
    }

    /** All seven days, Monday first. */
    public function week(): Collection
    {
        return $this->gymTimingRepository->week();
    }

    /**
     * Save all seven days at once. A closed day always stores null times.
     *
     * @param  list<array{day_of_week: int, is_closed: bool, opens_at?: ?string, closes_at?: ?string}>  $timings
     */
    public function updateWeek(array $timings): Collection
    {
        DB::transaction(function () use ($timings): void {
            foreach ($timings as $timing) {
                $isClosed = (bool) $timing['is_closed'];

                $this->gymTimingRepository->updateOrCreate(
                    ['day_of_week' => (int) $timing['day_of_week']],
                    [
                        'is_closed' => $isClosed,
                        'opens_at' => $isClosed ? null : $timing['opens_at'],
                        'closes_at' => $isClosed ? null : $timing['closes_at'],
                    ],
                );
            }
        });

        AdminDashboardService::forgetCache();

        return $this->week();
    }

    public function today(): ?GymTiming
    {
        return $this->gymTimingRepository->forDay($this->now()->dayOfWeek);
    }

    public function todayDayOfWeek(): int
    {
        return $this->now()->dayOfWeek;
    }

    /**
     * Open when today isn't closed and opens_at <= now < closes_at (gym time).
     * Pass today's row when it's already loaded to skip the lookup.
     */
    public function isOpenNow(?GymTiming $today = null): bool
    {
        $today ??= $this->today();

        if ($today === null || $today->is_closed || $today->opens_at === null || $today->closes_at === null) {
            return false;
        }

        $time = $this->now()->format('H:i:s');

        return $time >= $this->normaliseTime($today->opens_at) && $time < $this->normaliseTime($today->closes_at);
    }

    private function now(): CarbonImmutable
    {
        return CarbonImmutable::now(DateFormat::timezone());
    }

    /** "06:00" or "06:00:00" → "06:00:00", so string comparison is safe. */
    private function normaliseTime(string $time): string
    {
        return strlen($time) === 5 ? $time.':00' : $time;
    }
}
