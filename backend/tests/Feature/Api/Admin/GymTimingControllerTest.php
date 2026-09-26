<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\GymTiming;
use Tests\TestCase;

class GymTimingControllerTest extends TestCase
{
    private const BASE = '/api/admin/gym-timings';

    // ------------------------------------------------------------ index

    public function test_index_returns_seven_days_monday_first(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE)
            ->assertOk()
            ->assertJsonPath('message', 'Gym timings retrieved successfully')
            ->assertJsonCount(7, 'data.timings')
            ->assertJsonPath('data.timezone', 'UTC')
            ->assertJsonStructure(['data' => ['is_open_now', 'timings' => [['day_of_week', 'day_name', 'is_closed', 'opens_at', 'closes_at', 'updated_at']]]]);

        $this->assertSame([1, 2, 3, 4, 5, 6, 0], collect($response->json('data.timings'))->pluck('day_of_week')->all());
        $response->assertJsonPath('data.timings.0.day_name', 'Monday')
            ->assertJsonPath('data.timings.0.opens_at', '06:00')
            ->assertJsonPath('data.timings.6.is_closed', true);
    }

    // ------------------------------------------------------------ update

    public function test_bulk_update_persists(): void
    {
        $admin = $this->actingAsAdmin();

        $this->putJson(self::BASE, $this->payload([1 => ['opens_at' => '07:00', 'closes_at' => '21:00']]))
            ->assertOk()
            ->assertJsonPath('message', 'Gym timings updated successfully')
            ->assertJsonPath('data.timings.0.opens_at', '07:00')
            ->assertJsonPath('data.timings.0.closes_at', '21:00');

        $monday = GymTiming::query()->where('day_of_week', 1)->first();
        $this->assertSame('07:00:00', $monday->opens_at);
        $this->assertSame($admin->id, $monday->updated_by);
    }

    public function test_closed_day_stores_null_times(): void
    {
        $this->actingAsAdmin();

        $this->putJson(self::BASE, $this->payload([3 => ['is_closed' => true, 'opens_at' => '06:00', 'closes_at' => '22:00']]))
            ->assertOk();

        $this->assertDatabaseHas('gym_timings', ['day_of_week' => 3, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null]);
    }

    public function test_closing_before_opening_names_the_day(): void
    {
        $this->actingAsAdmin();

        $this->putJson(self::BASE, $this->payload([2 => ['opens_at' => '20:00', 'closes_at' => '08:00']]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timings.1.closes_at' => 'Closing time must be after opening time for Tuesday.']);
    }

    public function test_equal_opening_and_closing_times_are_rejected(): void
    {
        $this->actingAsAdmin();

        $this->putJson(self::BASE, $this->payload([2 => ['opens_at' => '08:00', 'closes_at' => '08:00']]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timings.1.closes_at']);
    }

    public function test_open_day_requires_times(): void
    {
        $this->actingAsAdmin();

        $this->putJson(self::BASE, $this->payload([4 => ['opens_at' => null, 'closes_at' => null]]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timings.3.opens_at', 'timings.3.closes_at']);
    }

    public function test_fewer_than_seven_rows_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->putJson(self::BASE, ['timings' => array_slice($this->payload()['timings'], 0, 6)])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timings']);
    }

    public function test_duplicate_day_is_rejected(): void
    {
        $this->actingAsAdmin();
        $payload = $this->payload();
        $payload['timings'][6]['day_of_week'] = 1;

        $this->putJson(self::BASE, $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timings.6.day_of_week']);
    }

    public function test_bad_time_format_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->putJson(self::BASE, $this->payload([1 => ['opens_at' => '6am']]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timings.0.opens_at']);
    }

    // ------------------------------------------------------------ access

    public function test_member_token_gets_403(): void
    {
        $this->actingAsMember();

        $this->assertApiError($this->getJson(self::BASE), 403);
        $this->assertApiError($this->putJson(self::BASE, $this->payload()), 403);
    }

    public function test_requires_a_token(): void
    {
        $this->assertApiError($this->getJson(self::BASE), 401);
    }

    // ------------------------------------------------------------ helpers

    /**
     * A valid week (Monday first), with per-day overrides keyed by day_of_week.
     *
     * @param  array<int, array<string, mixed>>  $overrides
     */
    private function payload(array $overrides = []): array
    {
        $timings = [];

        foreach ([1, 2, 3, 4, 5, 6, 0] as $day) {
            $timings[] = array_merge(
                ['day_of_week' => $day, 'is_closed' => $day === 0, 'opens_at' => $day === 0 ? null : '06:00', 'closes_at' => $day === 0 ? null : '22:00'],
                $overrides[$day] ?? [],
            );
        }

        return ['timings' => $timings];
    }
}
