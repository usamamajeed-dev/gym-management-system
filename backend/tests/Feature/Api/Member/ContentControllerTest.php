<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use App\Models\Content;
use Tests\TestCase;

class ContentControllerTest extends TestCase
{
    public function test_type_is_required(): void
    {
        $this->actingAsMember();

        $this->getJson('/api/v1/contents')->assertStatus(422)->assertJsonValidationErrors(['type']);
        $this->getJson('/api/v1/contents?type=blog')->assertStatus(422)->assertJsonValidationErrors(['type']);
        $this->getJson('/api/v1/contents?type=news&period=someday')->assertStatus(422)->assertJsonValidationErrors(['period']);
    }

    public function test_current_lists_published_and_archive_lists_archived(): void
    {
        $this->actingAsMember();
        $published = Content::factory()->news()->published()->create();
        $archived = Content::factory()->news()->archived()->create();
        Content::factory()->news()->draft()->create();
        Content::factory()->policy()->published()->create();

        $current = $this->getJson('/api/v1/contents?type=news');
        $this->assertPaginated($current, 1);
        $current->assertJsonPath('message', 'News retrieved successfully')->assertJsonPath('data.list.0.id', $published->id);

        $archive = $this->getJson('/api/v1/contents?type=news&period=archive');
        $this->assertPaginated($archive, 1);
        $archive->assertJsonPath('data.list.0.id', $archived->id)->assertJsonPath('data.list.0.status', 'archived');
    }

    public function test_policies_list(): void
    {
        $this->actingAsMember();
        $policy = Content::factory()->policy()->published()->create();

        $this->getJson('/api/v1/contents?type=policy&period=current')
            ->assertJsonPath('message', 'Policies retrieved successfully')
            ->assertJsonPath('data.list.0.id', $policy->id);
    }

    public function test_newest_first_paginated_by_ten(): void
    {
        $this->actingAsMember();
        foreach (range(1, 12) as $daysAgo) {
            Content::factory()->news()->published(now()->subDays($daysAgo))->create();
        }
        $newest = Content::factory()->news()->published(now()->subHour())->create();

        $response = $this->getJson('/api/v1/contents?type=news');
        $this->assertPaginated($response, 10);
        $response->assertJsonPath('data.list.0.id', $newest->id)
            ->assertJsonPath('data.pagination.total', 13)
            ->assertJsonPath('data.pagination.total_pages', 2);

        $this->assertPaginated($this->getJson('/api/v1/contents?type=news&page=2'), 3);
    }

    public function test_list_items_have_no_body_but_show_does(): void
    {
        $this->actingAsMember();
        $content = Content::factory()->published()->create();

        $this->assertArrayNotHasKey('body', $this->getJson('/api/v1/contents?type=news')->json('data.list.0'));

        $this->getJson("/api/v1/contents/{$content->id}")
            ->assertOk()
            ->assertJsonPath('message', 'News retrieved successfully')
            ->assertJsonPath('data.body', $content->body);
    }

    public function test_archived_item_can_be_shown(): void
    {
        $this->actingAsMember();
        $archived = Content::factory()->policy()->archived()->create();

        $this->getJson("/api/v1/contents/{$archived->id}")->assertOk()->assertJsonPath('data.status', 'archived');
    }

    public function test_draft_is_never_shown(): void
    {
        $this->actingAsMember();
        $draft = Content::factory()->news()->draft()->create();

        $this->getJson("/api/v1/contents/{$draft->id}")->assertStatus(404)->assertJsonPath('message', 'News not found');
    }
}
