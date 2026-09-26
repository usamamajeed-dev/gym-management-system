<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\Event;
use App\Models\EventType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EventControllerTest extends TestCase
{
    private const BASE = '/api/admin/events';

    // ------------------------------------------------------------ create

    public function test_create_with_an_image(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->post(self::BASE, $this->payload(['image' => UploadedFile::fake()->image('yoga.jpg')]));

        $response->assertCreated()
            ->assertJsonPath('message', 'Event created successfully')
            ->assertJsonPath('data.title', 'Yoga Class')
            ->assertJsonPath('data.is_published', true)
            ->assertJsonPath('data.event_type.value', $this->type()->id)
            ->assertJsonPath('data.created_by.id', $admin->id);

        $event = Event::query()->findOrFail($response->json('data.id'));
        Storage::disk('public')->assertExists($event->image_path);
        $this->assertStringStartsWith('events/', $event->image_path);
        $this->assertSame(Storage::disk('public')->url($event->image_path), $response->json('data.image_url'));
        $response->assertJsonMissingPath('data.image_path');
    }

    public function test_create_without_image_defaults_to_draft(): void
    {
        $this->actingAsAdmin();

        $payload = $this->payload();
        unset($payload['is_published']);

        $this->postJson(self::BASE, $payload)
            ->assertCreated()
            ->assertJsonPath('data.is_published', false)
            ->assertJsonPath('data.image_url', null);
    }

    public function test_times_round_trip_in_the_gym_timezone(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        $this->actingAsAdmin();

        $response = $this->postJson(self::BASE, $this->payload([
            'starts_at' => '2026-10-05 18:00',
            'ends_at' => '2026-10-05 19:30',
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.starts_at', '2026-10-05T18:00:00+05:00')
            ->assertJsonPath('data.ends_at', '2026-10-05T19:30:00+05:00');

        $this->assertSame('2026-10-05 13:00:00', Event::query()->find($response->json('data.id'))->getRawOriginal('starts_at'));
    }

    public function test_iso_input_with_offset_is_respected(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload(['starts_at' => '2026-10-05T13:00:00+00:00', 'ends_at' => null]))
            ->assertCreated()
            ->assertJsonPath('data.starts_at', '2026-10-05T18:00:00+05:00');
    }

    // ------------------------------------------------------------ validation

    public function test_ends_before_start_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload(['starts_at' => '2026-10-05 18:00', 'ends_at' => '2026-10-05 17:00']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ends_at']);
    }

    public function test_update_with_only_ends_at_is_checked_against_the_stored_start(): void
    {
        $this->actingAsAdmin();
        $event = Event::factory()->create(['starts_at' => '2026-10-05 18:00:00', 'ends_at' => null]);

        $this->putJson(self::BASE."/{$event->id}", ['ends_at' => '2026-10-05 17:00'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ends_at']);
    }

    public function test_inactive_event_type_is_rejected(): void
    {
        $this->actingAsAdmin();
        $inactive = EventType::factory()->inactive()->create();

        $this->postJson(self::BASE, $this->payload(['event_type_id' => $inactive->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['event_type_id']);
    }

    public function test_required_fields_and_limits(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, [])->assertStatus(422)->assertJsonValidationErrors(['event_type_id', 'title', 'starts_at']);
        $this->postJson(self::BASE, $this->payload(['title' => str_repeat('a', 151), 'capacity' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'capacity']);
    }

    public function test_non_image_upload_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post(self::BASE, $this->payload(['image' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    // ------------------------------------------------------------ update

    public function test_update_replaces_the_image_and_deletes_the_old_file(): void
    {
        $this->actingAsAdmin();
        $event = $this->eventWithImage();
        $old = $event->image_path;

        $response = $this->post(self::BASE."/{$event->id}", [
            '_method' => 'PUT',
            'title' => 'Renamed',
            'image' => UploadedFile::fake()->image('new.png'),
        ]);

        $response->assertOk()->assertJsonPath('message', 'Event updated successfully')->assertJsonPath('data.title', 'Renamed');
        $new = $event->fresh()->image_path;
        $this->assertNotSame($old, $new);
        Storage::disk('public')->assertExists($new);
        Storage::disk('public')->assertMissing($old);
    }

    public function test_remove_image_deletes_the_file(): void
    {
        $this->actingAsAdmin();
        $event = $this->eventWithImage();
        $old = $event->image_path;

        $this->post(self::BASE."/{$event->id}", ['_method' => 'PUT', 'remove_image' => '1'])
            ->assertOk()
            ->assertJsonPath('data.image_url', null);

        $this->assertNull($event->fresh()->image_path);
        Storage::disk('public')->assertMissing($old);
    }

    public function test_publish_toggle_as_multipart_partial_update(): void
    {
        $this->actingAsAdmin();
        $event = $this->eventWithImage(['is_published' => false]);

        $this->post(self::BASE."/{$event->id}", ['_method' => 'PUT', 'is_published' => '1'])
            ->assertOk()
            ->assertJsonPath('data.is_published', true)
            ->assertJsonPath('data.title', $event->title);

        Storage::disk('public')->assertExists($event->image_path);
    }

    // ------------------------------------------------------------ list filters

    public function test_filters_by_type_and_published_flag(): void
    {
        $this->actingAsAdmin();
        $type = $this->type();
        $match = Event::factory()->for($type)->published()->create();
        Event::factory()->for($type)->draft()->create();
        Event::factory()->published()->create();

        $response = $this->getJson(self::BASE."?event_type_id={$type->id}&is_published=true");

        $this->assertPaginated($response, 1);
        $response->assertJsonPath('data.list.0.id', $match->id);

        $this->assertPaginated($this->getJson(self::BASE.'?is_published=false'), 1);
    }

    public function test_filters_by_date_range_in_gym_time(): void
    {
        config(['gym.timezone' => 'Asia/Karachi']);
        $this->actingAsAdmin();
        // 2026-10-09 20:00 UTC is 2026-10-10 01:00 in Karachi.
        $lateNight = Event::factory()->create(['starts_at' => Carbon::parse('2026-10-09 20:00:00', 'UTC')]);
        Event::factory()->create(['starts_at' => Carbon::parse('2026-10-20 10:00:00', 'UTC')]);
        Event::factory()->create(['starts_at' => Carbon::parse('2026-09-01 10:00:00', 'UTC')]);

        $response = $this->getJson(self::BASE.'?from=2026-10-10&to=2026-10-15');

        $this->assertPaginated($response, 1);
        $response->assertJsonPath('data.list.0.id', $lateNight->id);

        $this->assertPaginated($this->getJson(self::BASE.'?from=2026-10-01'), 2);
        $this->assertPaginated($this->getJson(self::BASE.'?to=2026-09-30'), 1);
    }

    public function test_search_and_default_sort(): void
    {
        $this->actingAsAdmin();
        $early = Event::factory()->create(['title' => 'Morning Spin', 'starts_at' => now()->addDay()]);
        $late = Event::factory()->create(['title' => 'Evening Spin', 'starts_at' => now()->addDays(5)]);
        Event::factory()->create(['title' => 'Boxing', 'location' => 'Ring']);

        $response = $this->getJson(self::BASE.'?search=spin');

        $this->assertPaginated($response, 2);
        $this->assertSame([$late->id, $early->id], collect($response->json('data.list'))->pluck('id')->all());
        $this->assertPaginated($this->getJson(self::BASE.'?search=ring'), 1);
    }

    // ------------------------------------------------------------ show / delete / access

    public function test_show_returns_the_event_with_its_type(): void
    {
        $this->actingAsAdmin();
        $event = Event::factory()->create();

        $this->getJson(self::BASE."/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $event->id)
            ->assertJsonStructure(['data' => ['event_type' => ['value', 'title', 'color']]]);
    }

    public function test_delete_removes_the_image(): void
    {
        $this->actingAsAdmin();
        $event = $this->eventWithImage();

        $this->deleteJson(self::BASE."/{$event->id}")->assertOk()->assertJsonPath('message', 'Event deleted successfully');

        $this->assertDatabaseMissing('events', ['id' => $event->id]);
        Storage::disk('public')->assertMissing($event->image_path);
    }

    public function test_member_token_gets_403(): void
    {
        $this->actingAsMember();
        $event = Event::factory()->create();

        $this->assertApiError($this->getJson(self::BASE), 403);
        $this->assertApiError($this->postJson(self::BASE, $this->payload()), 403);
        $this->assertApiError($this->putJson(self::BASE."/{$event->id}", ['title' => 'x']), 403);
        $this->assertApiError($this->deleteJson(self::BASE."/{$event->id}"), 403);
    }

    // ------------------------------------------------------------ helpers

    private ?EventType $type = null;

    private function type(): EventType
    {
        return $this->type ??= EventType::factory()->create();
    }

    private function eventWithImage(array $attributes = []): Event
    {
        $path = UploadedFile::fake()->image('old.jpg')->store('events', 'public');

        return Event::factory()->for($this->type())->create(['image_path' => $path, ...$attributes]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'event_type_id' => $this->type()->id,
            'title' => 'Yoga Class',
            'description' => 'Beginner friendly.',
            'location' => 'Studio 2',
            'starts_at' => now()->addDays(3)->format('Y-m-d').' 18:00',
            'ends_at' => now()->addDays(3)->format('Y-m-d').' 19:00',
            'capacity' => 20,
            'is_published' => true,
        ], $overrides);
    }
}
