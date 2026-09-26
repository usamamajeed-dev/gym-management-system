<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\Content;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContentControllerTest extends TestCase
{
    private const BASE = '/api/admin/contents';

    // ------------------------------------------------------------ create

    public function test_draft_news_has_no_publish_date(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload())
            ->assertCreated()
            ->assertJsonPath('message', 'News created successfully')
            ->assertJsonPath('data.type', 'news')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.published_at', null);
    }

    public function test_published_policy_gets_a_publish_date(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload(['type' => 'policy', 'title' => 'Locker Rules', 'status' => 'published']))
            ->assertCreated()
            ->assertJsonPath('message', 'Policy created successfully')
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.slug', 'locker-rules');

        $this->assertNotNull(Content::query()->where('slug', 'locker-rules')->value('published_at'));
    }

    public function test_cannot_create_as_archived(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload(['status' => 'archived']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_slugs_are_unique_for_duplicate_titles(): void
    {
        $this->actingAsAdmin();

        $first = $this->postJson(self::BASE, $this->payload())->json('data.slug');
        $second = $this->postJson(self::BASE, $this->payload())->json('data.slug');
        $third = $this->postJson(self::BASE, $this->payload(['type' => 'policy']))->json('data.slug');

        $this->assertSame(['holiday-hours', 'holiday-hours-2', 'holiday-hours-3'], [$first, $second, $third]);
    }

    public function test_script_tags_are_stripped_from_the_body(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson(self::BASE, $this->payload([
            'body' => '<p onclick="x()">Open late</p><script>alert(1)</script>',
        ]))->assertCreated();

        $this->assertSame('<p>Open late</p>', $response->json('data.body'));
    }

    public function test_create_with_an_image(): void
    {
        $this->actingAsAdmin();

        $response = $this->post(self::BASE, $this->payload(['image' => UploadedFile::fake()->image('cover.jpg')]))
            ->assertCreated();

        $path = Content::query()->findOrFail($response->json('data.id'))->image_path;
        $this->assertStringStartsWith('contents/', $path);
        Storage::disk('public')->assertExists($path);
        $response->assertJsonPath('data.image_url', Storage::disk('public')->url($path));
    }

    public function test_validation(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, [])->assertStatus(422)->assertJsonValidationErrors(['type', 'title', 'body']);
        $this->postJson(self::BASE, $this->payload(['type' => 'blog', 'excerpt' => str_repeat('a', 501)]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'excerpt']);
    }

    // ------------------------------------------------------------ update

    public function test_type_and_status_cannot_be_changed_on_update(): void
    {
        $this->actingAsAdmin();
        $draft = Content::factory()->news()->draft()->create();

        $this->putJson(self::BASE."/{$draft->id}", ['type' => 'policy', 'status' => 'published', 'title' => 'Renamed'])
            ->assertOk()
            ->assertJsonPath('message', 'News updated successfully')
            ->assertJsonPath('data.title', 'Renamed')
            ->assertJsonPath('data.type', 'news')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.published_at', null);
    }

    public function test_slug_follows_title_until_first_publish(): void
    {
        $this->actingAsAdmin();
        $draft = Content::factory()->draft()->create(['title' => 'Old', 'slug' => 'old']);
        $published = Content::factory()->published()->create(['title' => 'Stable', 'slug' => 'stable']);

        $this->putJson(self::BASE."/{$draft->id}", ['title' => 'New Title'])->assertJsonPath('data.slug', 'new-title');
        $this->putJson(self::BASE."/{$published->id}", ['title' => 'Changed'])->assertJsonPath('data.slug', 'stable');
    }

    public function test_multipart_update_replaces_the_image(): void
    {
        $this->actingAsAdmin();
        $old = UploadedFile::fake()->image('old.jpg')->store('contents', 'public');
        $content = Content::factory()->create(['image_path' => $old]);

        $this->post(self::BASE."/{$content->id}", ['_method' => 'PUT', 'image' => UploadedFile::fake()->image('new.jpg')])
            ->assertOk();

        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($content->fresh()->image_path);
    }

    public function test_remove_image(): void
    {
        $this->actingAsAdmin();
        $old = UploadedFile::fake()->image('old.jpg')->store('contents', 'public');
        $content = Content::factory()->create(['image_path' => $old]);

        $this->post(self::BASE."/{$content->id}", ['_method' => 'PUT', 'remove_image' => '1'])
            ->assertOk()
            ->assertJsonPath('data.image_url', null);

        Storage::disk('public')->assertMissing($old);
    }

    // ------------------------------------------------------------ publish / archive

    public function test_publish_a_draft(): void
    {
        $this->actingAsAdmin();
        $draft = Content::factory()->policy()->draft()->create();

        $this->postJson(self::BASE."/{$draft->id}/publish")
            ->assertOk()
            ->assertJsonPath('message', 'Policy published successfully')
            ->assertJsonPath('data.status', 'published');

        $this->assertNotNull($draft->fresh()->published_at);
    }

    public function test_archive_then_republish_keeps_the_first_publish_date(): void
    {
        $this->actingAsAdmin();
        $news = Content::factory()->published(now()->subDays(10))->create();
        $firstPublished = $news->published_at->toIso8601String();

        $this->postJson(self::BASE."/{$news->id}/archive")
            ->assertOk()
            ->assertJsonPath('message', 'News archived successfully')
            ->assertJsonPath('data.status', 'archived');
        $this->assertNotNull($news->fresh()->archived_at);

        $this->postJson(self::BASE."/{$news->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.archived_at', null);
        $this->assertSame($firstPublished, $news->fresh()->published_at->toIso8601String());
    }

    public function test_invalid_transitions_are_conflicts(): void
    {
        $this->actingAsAdmin();
        $published = Content::factory()->published()->create();
        $draft = Content::factory()->draft()->create();
        $archived = Content::factory()->archived()->create();

        $this->assertApiError($this->postJson(self::BASE."/{$published->id}/publish"), 409, 'INVALID_CONTENT_TRANSITION');
        $this->assertApiError($this->postJson(self::BASE."/{$draft->id}/archive"), 409, 'INVALID_CONTENT_TRANSITION');
        $this->assertApiError($this->postJson(self::BASE."/{$archived->id}/archive"), 409, 'INVALID_CONTENT_TRANSITION');
    }

    // ------------------------------------------------------------ list / show / delete

    public function test_filters_by_type_status_and_search(): void
    {
        $this->actingAsAdmin();
        $news = Content::factory()->news()->published()->create(['title' => 'Pool reopening']);
        Content::factory()->news()->draft()->create();
        $policy = Content::factory()->policy()->published()->create(['excerpt' => 'Towel rules apply']);

        $response = $this->getJson(self::BASE.'?type=news&status=published');
        $this->assertPaginated($response, 1);
        $response->assertJsonPath('message', 'News retrieved successfully')->assertJsonPath('data.list.0.id', $news->id);

        $this->getJson(self::BASE.'?type=policy')->assertJsonPath('message', 'Policies retrieved successfully');
        $this->assertPaginated($this->getJson(self::BASE.'?status=draft'), 1);
        $this->getJson(self::BASE.'?search=towel')->assertJsonPath('data.list.0.id', $policy->id);
        $this->assertPaginated($this->getJson(self::BASE), 3);
    }

    public function test_list_items_have_no_body_and_show_does(): void
    {
        $this->actingAsAdmin();
        $content = Content::factory()->create(['excerpt' => null, 'body' => '<p>'.str_repeat('word ', 60).'</p>']);

        $item = $this->getJson(self::BASE)->json('data.list.0');
        $this->assertArrayNotHasKey('body', $item);
        $this->assertStringStartsWith('word word', $item['excerpt']);
        $this->assertLessThanOrEqual(163, mb_strlen($item['excerpt']));

        $this->getJson(self::BASE."/{$content->id}")->assertOk()->assertJsonPath('data.body', $content->body);
    }

    public function test_delete_removes_row_and_image(): void
    {
        $this->actingAsAdmin();
        $path = UploadedFile::fake()->image('x.jpg')->store('contents', 'public');
        $content = Content::factory()->policy()->create(['image_path' => $path]);

        $this->deleteJson(self::BASE."/{$content->id}")->assertOk()->assertJsonPath('message', 'Policy deleted successfully');

        $this->assertDatabaseMissing('contents', ['id' => $content->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_member_token_gets_403(): void
    {
        $this->actingAsMember();
        $content = Content::factory()->create();

        $this->assertApiError($this->getJson(self::BASE), 403);
        $this->assertApiError($this->postJson(self::BASE, $this->payload()), 403);
        $this->assertApiError($this->postJson(self::BASE."/{$content->id}/archive"), 403);
    }

    // ------------------------------------------------------------ helpers

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'news',
            'title' => 'Holiday Hours',
            'excerpt' => 'Reduced hours over the holidays.',
            'body' => '<p>We open at 08:00 on public holidays.</p>',
        ], $overrides);
    }
}
