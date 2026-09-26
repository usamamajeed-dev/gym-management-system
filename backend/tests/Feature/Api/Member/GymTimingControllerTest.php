<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use Illuminate\Support\Carbon;
use Tests\TestCase;

class GymTimingControllerTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_returns_seven_days_monday_first_with_today(): void
    {
        Carbon::setTestNow('2026-10-07 10:00:00'); // Wednesday
        $this->actingAsMember();

        $response = $this->getJson('/api/v1/gym-timings')
            ->assertOk()
            ->assertJsonPath('message', 'Gym timings retrieved successfully')
            ->assertJsonCount(7, 'data.timings')
            ->assertJsonPath('data.today_day_of_week', 3)
            ->assertJsonPath('data.is_open_now', true)
            ->assertJsonPath('data.timezone', 'UTC');

        $this->assertSame([1, 2, 3, 4, 5, 6, 0], collect($response->json('data.timings'))->pluck('day_of_week')->all());
    }

    public function test_is_open_now_follows_the_clock(): void
    {
        $this->actingAsMember();

        Carbon::setTestNow('2026-10-07 22:30:00');
        $this->getJson('/api/v1/gym-timings')->assertJsonPath('data.is_open_now', false);

        Carbon::setTestNow('2026-10-11 12:00:00'); // Sunday, closed
        $this->getJson('/api/v1/gym-timings')->assertJsonPath('data.is_open_now', false)->assertJsonPath('data.today_day_of_week', 0);
    }
}
