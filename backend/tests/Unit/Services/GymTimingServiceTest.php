<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\GymTiming;
use App\Services\GymTimingService;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** Needs the container, config and DB, so it extends the app TestCase. */
class GymTimingServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    // ------------------------------------------------------------ isOpenNow

    public function test_closed_before_opening_time(): void
    {
        $this->setMonday('06:00', '22:00');
        Carbon::setTestNow('2026-10-05 05:59:59');

        $this->assertFalse($this->service()->isOpenNow());
    }

    public function test_open_at_opening_time_and_during_the_day(): void
    {
        $this->setMonday('06:00', '22:00');

        Carbon::setTestNow('2026-10-05 06:00:00');
        $this->assertTrue($this->service()->isOpenNow());

        Carbon::setTestNow('2026-10-05 13:30:00');
        $this->assertTrue($this->service()->isOpenNow());
    }

    public function test_closed_exactly_at_closing_time(): void
    {
        $this->setMonday('06:00', '22:00');
        Carbon::setTestNow('2026-10-05 22:00:00');

        $this->assertFalse($this->service()->isOpenNow());
    }

    public function test_closed_all_day_on_a_closed_day(): void
    {
        Carbon::setTestNow('2026-10-04 12:00:00'); // a Sunday, seeded as closed

        $this->assertFalse($this->service()->isOpenNow());
        $this->assertTrue($this->service()->today()->is_closed);
    }

    public function test_uses_the_gym_timezone(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        $this->setMonday('06:00', '22:00');

        // Sunday 21:00 UTC is already Monday 02:00 in Karachi (UTC+5): Monday's row, before opening.
        Carbon::setTestNow(Carbon::parse('2026-10-04 21:00:00', 'UTC'));
        $this->assertSame(1, $this->service()->todayDayOfWeek());
        $this->assertFalse($this->service()->isOpenNow());

        // Monday 01:30 UTC is Monday 06:30 in Karachi: open, although Sunday (closed) in no timezone applies.
        Carbon::setTestNow(Carbon::parse('2026-10-05 01:30:00', 'UTC'));
        $this->assertSame(1, $this->service()->todayDayOfWeek());
        $this->assertTrue($this->service()->isOpenNow());
    }

    // ------------------------------------------------------------ week

    public function test_week_is_ordered_monday_first(): void
    {
        $this->assertSame([1, 2, 3, 4, 5, 6, 0], $this->service()->week()->pluck('day_of_week')->all());
    }

    // ------------------------------------------------------------ helpers

    private function setMonday(string $opens, string $closes): void
    {
        GymTiming::query()->where('day_of_week', 1)->update(['is_closed' => false, 'opens_at' => $opens, 'closes_at' => $closes]);
    }

    private function service(): GymTimingService
    {
        return app(GymTimingService::class);
    }
}
