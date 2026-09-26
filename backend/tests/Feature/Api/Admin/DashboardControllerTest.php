<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\Content;
use App\Models\Event;
use App\Models\User;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    private const URI = '/api/admin/dashboard';

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    // ------------------------------------------------------------ access

    public function test_member_token_gets_403(): void
    {
        $this->actingAsMember();

        $this->assertApiError($this->getJson(self::URI), 403);
    }

    // ------------------------------------------------------------ member counts

    public function test_member_counts_match_the_fixture_and_exclude_admins(): void
    {
        $this->actingAsAdmin();
        $this->fixture();

        $this->getJson(self::URI)
            ->assertOk()
            ->assertJsonPath('message', 'Dashboard retrieved successfully')
            ->assertJsonPath('data.members', [
                'total' => 7,
                'pending' => 3,
                'approved' => 3,
                'rejected' => 1,
                'active' => 2,
                'inactive' => 1,
                'new_this_month' => 7,
            ]);
    }

    public function test_soft_deleted_members_are_not_counted(): void
    {
        $this->actingAsAdmin();
        $this->makeMember()->delete();
        $this->makeMember();

        $this->getJson(self::URI)->assertJsonPath('data.members.total', 1)->assertJsonPath('data.members.pending', 1);
    }

    // ------------------------------------------------------------ registrations by month

    public function test_registrations_by_month_has_six_zero_filled_entries(): void
    {
        Carbon::setTestNow('2026-10-15 12:00:00');
        $this->actingAsAdmin();
        $this->makeMember(['created_at' => '2026-10-02 10:00:00']);
        $this->makeMember(['created_at' => '2026-10-03 10:00:00']);
        $this->makeMember(['created_at' => '2026-07-20 10:00:00']);
        $this->makeMember(['created_at' => '2026-04-30 10:00:00']);

        $this->getJson(self::URI)->assertJsonPath('data.registrations_by_month', [
            ['month' => '2026-05', 'count' => 0],
            ['month' => '2026-06', 'count' => 0],
            ['month' => '2026-07', 'count' => 1],
            ['month' => '2026-08', 'count' => 0],
            ['month' => '2026-09', 'count' => 0],
            ['month' => '2026-10', 'count' => 2],
        ])->assertJsonPath('data.members.new_this_month', 2);
    }

    public function test_registration_months_use_the_gym_timezone(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        Carbon::setTestNow(Carbon::parse('2026-10-15 12:00:00', 'UTC'));
        $this->actingAsAdmin();
        // 2026-09-30 20:00 UTC is 2026-10-01 01:00 in Karachi.
        $this->makeMember(['created_at' => '2026-09-30 20:00:00']);

        $months = collect($this->getJson(self::URI)->json('data.registrations_by_month'))->pluck('count', 'month');

        $this->assertSame(1, $months['2026-10']);
        $this->assertSame(0, $months['2026-09']);
    }

    // ------------------------------------------------------------ lists

    public function test_pending_members_are_oldest_first_and_recent_members_newest_first(): void
    {
        $this->actingAsAdmin();
        $oldest = $this->makeMember(['created_at' => now()->subDays(5)]);
        $middle = $this->makeMember(['created_at' => now()->subDays(3)]);
        $newest = $this->makeMember(['created_at' => now()->subDay()]);

        $response = $this->getJson(self::URI);

        $this->assertSame([$oldest->id, $middle->id, $newest->id], collect($response->json('data.pending_members'))->pluck('id')->all());
        $this->assertSame($newest->id, $response->json('data.recent_members.0.id'));
    }

    public function test_event_and_content_sections(): void
    {
        Carbon::setTestNow('2026-10-15 12:00:00');
        $this->actingAsAdmin();
        Event::factory()->published()->create(['starts_at' => '2026-10-05 18:00:00']);
        $next = Event::factory()->published()->create(['starts_at' => '2026-10-20 18:00:00']);
        Event::factory()->published()->create(['starts_at' => '2026-11-03 18:00:00']);
        Event::factory()->draft()->create(['starts_at' => '2026-10-25 18:00:00']);
        Content::factory()->count(2)->news()->published()->create();
        Content::factory()->policy()->published()->create();
        Content::factory()->news()->draft()->create();
        Content::factory()->policy()->archived()->create();

        $response = $this->getJson(self::URI)
            ->assertJsonPath('data.events.this_month', 2)
            ->assertJsonPath('data.events.upcoming', 2)
            ->assertJsonPath('data.events.drafts', 1)
            ->assertJsonPath('data.events.next.0.id', $next->id)
            ->assertJsonPath('data.contents.news_published', 2)
            ->assertJsonPath('data.contents.policies_published', 1)
            ->assertJsonPath('data.contents.drafts', 1)
            ->assertJsonPath('data.contents.archived', 1)
            ->assertJsonCount(5, 'data.contents.latest')
            ->assertJsonStructure(['data' => ['gym' => ['is_open_now', 'today_timing', 'timezone']]]);

        $this->assertCount(2, $response->json('data.events.next'));
    }

    // ------------------------------------------------------------ cache

    public function test_cache_is_refreshed_after_an_approval(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->getJson(self::URI)->assertJsonPath('data.members.pending', 1)->assertJsonPath('data.members.approved', 0);

        $this->postJson("/api/admin/members/{$member->id}/approve")->assertOk();

        $this->getJson(self::URI)->assertJsonPath('data.members.pending', 0)->assertJsonPath('data.members.approved', 1);
    }

    public function test_cache_is_refreshed_after_a_registration(): void
    {
        $this->actingAsAdmin();

        $this->getJson(self::URI)->assertJsonPath('data.members.pending', 0);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'New Person',
            'email' => 'new.person@example.com',
            'phone' => '+14155550123',
            'password' => 'Secret@123',
            'password_confirmation' => 'Secret@123',
        ])->assertCreated();

        $this->getJson(self::URI)->assertJsonPath('data.members.pending', 1);
    }

    public function test_result_is_cached_between_requests(): void
    {
        $this->actingAsAdmin();
        $this->getJson(self::URI)->assertJsonPath('data.members.pending', 0);

        // A write that bypasses the services leaves the cached numbers in place.
        User::factory()->member()->pending()->create();

        $this->getJson(self::URI)->assertJsonPath('data.members.pending', 0);
    }

    // ------------------------------------------------------------ performance

    public function test_dashboard_uses_at_most_twelve_queries(): void
    {
        $this->fixture();
        Event::factory()->count(3)->published()->create();
        Content::factory()->count(3)->create();
        AdminDashboardService::forgetCache();

        DB::enableQueryLog();
        app(AdminDashboardService::class)->build();
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertLessThanOrEqual(12, $queries);
    }

    // ------------------------------------------------------------ helpers

    /** 3 pending, 2 approved + active, 1 approved + inactive, 1 rejected. */
    private function fixture(): void
    {
        User::factory()->count(3)->member()->pending()->create();
        User::factory()->count(2)->member()->approved()->create();
        User::factory()->member()->approved()->inactive()->create();
        User::factory()->member()->rejected()->create();
    }
}
