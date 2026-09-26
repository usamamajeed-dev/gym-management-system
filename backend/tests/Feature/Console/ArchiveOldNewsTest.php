<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use App\Enums\ContentStatus;
use App\Models\Content;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ArchiveOldNewsTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_archives_only_published_news_from_previous_months(): void
    {
        Carbon::setTestNow('2026-10-15 12:00:00');

        $lastMonth = Content::factory()->news()->published(Carbon::parse('2026-09-30 23:00:00'))->create();
        $thisMonth = Content::factory()->news()->published(Carbon::parse('2026-10-01 00:00:00'))->create();
        $oldPolicy = Content::factory()->policy()->published(Carbon::parse('2026-01-01 09:00:00'))->create();
        $draft = Content::factory()->news()->draft()->create();

        $this->artisan('contents:archive-old-news')
            ->expectsOutput('Archived 1 news item(s).')
            ->assertSuccessful();

        $this->assertSame(ContentStatus::ARCHIVED, $lastMonth->fresh()->status);
        $this->assertNotNull($lastMonth->fresh()->archived_at);
        $this->assertSame(ContentStatus::PUBLISHED, $thisMonth->fresh()->status);
        $this->assertSame(ContentStatus::PUBLISHED, $oldPolicy->fresh()->status);
        $this->assertSame(ContentStatus::DRAFT, $draft->fresh()->status);
    }

    public function test_month_start_is_computed_in_the_gym_timezone(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        Carbon::setTestNow(Carbon::parse('2026-10-15 12:00:00', 'UTC'));

        // 2026-09-30 20:00 UTC is already 2026-10-01 01:00 in Karachi: this month, keep it.
        $localThisMonth = Content::factory()->news()->published(Carbon::parse('2026-09-30 20:00:00', 'UTC'))->create();
        // 2026-09-30 18:00 UTC is 2026-09-30 23:00 in Karachi: last month, archive it.
        $localLastMonth = Content::factory()->news()->published(Carbon::parse('2026-09-30 18:00:00', 'UTC'))->create();

        $this->artisan('contents:archive-old-news')->assertSuccessful();

        $this->assertSame(ContentStatus::PUBLISHED, $localThisMonth->fresh()->status);
        $this->assertSame(ContentStatus::ARCHIVED, $localLastMonth->fresh()->status);
    }
}
