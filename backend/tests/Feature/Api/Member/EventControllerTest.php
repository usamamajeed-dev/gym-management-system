<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use App\Models\Event;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class EventControllerTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_lists_only_published_events_of_the_month_in_order(): void
    {
        $this->actingAsMember();
        $later = Event::factory()->published()->create(['starts_at' => '2026-10-20 18:00:00', 'ends_at' => null]);
        $earlier = Event::factory()->published()->create(['starts_at' => '2026-10-05 09:00:00', 'ends_at' => null]);
        Event::factory()->draft()->create(['starts_at' => '2026-10-10 18:00:00']);
        Event::factory()->published()->create(['starts_at' => '2026-11-02 18:00:00', 'ends_at' => null]);

        $response = $this->getJson('/api/v1/events?month=2026-10')
            ->assertOk()
            ->assertJsonPath('message', 'Events retrieved successfully')
            ->assertJsonPath('data.month', '2026-10');

        $this->assertSame([$earlier->id, $later->id], collect($response->json('data.events'))->pluck('id')->all());
        $response->assertJsonStructure(['data' => ['events' => [['id', 'title', 'starts_at', 'ends_at', 'image_url', 'event_type' => ['value', 'title', 'color']]]]]);
        $response->assertJsonMissingPath('data.events.0.created_by');
    }

    public function test_event_spanning_two_months_appears_in_both(): void
    {
        $this->actingAsMember();
        $camp = Event::factory()->published()->create(['starts_at' => '2026-09-30 08:00:00', 'ends_at' => '2026-10-02 18:00:00']);

        $this->assertContains($camp->id, $this->eventIds('2026-09'));
        $this->assertContains($camp->id, $this->eventIds('2026-10'));
        $this->assertNotContains($camp->id, $this->eventIds('2026-11'));
    }

    public function test_month_boundaries_use_the_gym_timezone(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        $this->actingAsMember();
        // 2026-09-30 20:00 UTC is 2026-10-01 01:00 in Karachi.
        $event = Event::factory()->published()->create(['starts_at' => '2026-09-30 20:00:00', 'ends_at' => null]);

        $this->assertContains($event->id, $this->eventIds('2026-10'));
        $this->assertNotContains($event->id, $this->eventIds('2026-09'));
    }

    public function test_defaults_to_the_current_month(): void
    {
        Carbon::setTestNow('2026-10-15 12:00:00');
        $this->actingAsMember();
        $event = Event::factory()->published()->create(['starts_at' => '2026-10-20 18:00:00']);

        $this->getJson('/api/v1/events')->assertJsonPath('data.month', '2026-10')->assertJsonPath('data.events.0.id', $event->id);
    }

    public function test_bad_month_format_is_rejected(): void
    {
        $this->actingAsMember();

        $this->getJson('/api/v1/events?month=10-2026')->assertStatus(422)->assertJsonValidationErrors(['month']);
        $this->getJson('/api/v1/events?month=2026-13')->assertStatus(422);
    }

    public function test_show_a_published_event(): void
    {
        $this->actingAsMember();
        $event = Event::factory()->published()->create();

        $this->getJson("/api/v1/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $event->id)
            ->assertJsonPath('data.event_type.value', $event->event_type_id);
    }

    public function test_show_a_draft_is_404(): void
    {
        $this->actingAsMember();
        $draft = Event::factory()->draft()->create();

        $this->getJson("/api/v1/events/{$draft->id}")->assertStatus(404)->assertJsonPath('message', 'Event not found');
    }

    /** @return list<int> */
    private function eventIds(string $month): array
    {
        return collect($this->getJson("/api/v1/events?month={$month}")->json('data.events'))->pluck('id')->all();
    }
}
