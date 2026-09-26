<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use App\Models\Content;
use App\Models\Event;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_dashboard_has_every_section(): void
    {
        Carbon::setTestNow('2026-10-07 10:00:00'); // Wednesday, open
        $member = $this->actingAsMember(['membership_number' => 'GYM-2026-00009']);

        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('message', 'Dashboard retrieved successfully')
            ->assertJsonPath('data.member.id', $member->id)
            ->assertJsonPath('data.member.membership_number', 'GYM-2026-00009')
            ->assertJsonPath('data.gym.name', config('gym.name'))
            ->assertJsonPath('data.gym.timezone', 'UTC')
            ->assertJsonPath('data.today_timing.day_of_week', 3)
            ->assertJsonPath('data.is_open_now', true)
            ->assertJsonStructure(['data' => ['upcoming_events', 'latest_news', 'counts' => ['events_this_month', 'policies']]]);
    }

    public function test_at_most_three_upcoming_events_and_no_past_or_draft_ones(): void
    {
        Carbon::setTestNow('2026-10-07 10:00:00');
        $this->actingAsMember();
        Event::factory()->published()->create(['starts_at' => '2026-10-06 18:00:00']);
        Event::factory()->draft()->create(['starts_at' => '2026-10-08 08:00:00']);
        $next = Event::factory()->published()->create(['starts_at' => '2026-10-08 18:00:00']);
        Event::factory()->count(3)->published()->create(['starts_at' => '2026-10-20 18:00:00']);

        $events = $this->getJson('/api/v1/dashboard')->json('data.upcoming_events');

        $this->assertCount(3, $events);
        $this->assertSame($next->id, $events[0]['id']);
    }

    public function test_at_most_three_latest_news_and_counts(): void
    {
        Carbon::setTestNow('2026-10-07 10:00:00');
        $this->actingAsMember();
        Content::factory()->count(4)->news()->published()->create();
        Content::factory()->news()->draft()->create();
        Content::factory()->count(2)->policy()->published()->create();
        Content::factory()->policy()->archived()->create();
        Event::factory()->count(2)->published()->create(['starts_at' => '2026-10-02 18:00:00']);
        Event::factory()->published()->create(['starts_at' => '2026-11-02 18:00:00']);

        $response = $this->getJson('/api/v1/dashboard');

        $this->assertCount(3, $response->json('data.latest_news'));
        $this->assertArrayNotHasKey('body', $response->json('data.latest_news.0'));
        $response->assertJsonPath('data.counts.policies', 2)->assertJsonPath('data.counts.events_this_month', 2);
    }

    public function test_empty_lists_when_nothing_is_published(): void
    {
        $this->actingAsMember();

        $this->getJson('/api/v1/dashboard')
            ->assertJsonPath('data.upcoming_events', [])
            ->assertJsonPath('data.latest_news', []);
    }
}
