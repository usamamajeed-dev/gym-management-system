<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\Event;
use App\Models\EventType;
use Tests\TestCase;

class EventTypeControllerTest extends TestCase
{
    private const BASE = '/api/admin/event-types';

    // ------------------------------------------------------------ CRUD

    public function test_create_generates_a_slug(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload())
            ->assertCreated()
            ->assertJsonPath('message', 'Event type created successfully')
            ->assertJsonPath('data.name', 'Yoga Flow')
            ->assertJsonPath('data.slug', 'yoga-flow')
            ->assertJsonPath('data.color', '#FF5722')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.events_count', 0);
    }

    public function test_list_includes_events_count_and_searches_by_name(): void
    {
        $this->actingAsAdmin();
        $yoga = EventType::factory()->create(['name' => 'Yoga']);
        Event::factory()->count(2)->for($yoga)->create();
        EventType::factory()->create(['name' => 'Boxing']);

        $response = $this->getJson(self::BASE.'?search=yog');

        $this->assertPaginated($response, 1);
        $response->assertJsonPath('data.list.0.id', $yoga->id)->assertJsonPath('data.list.0.events_count', 2);
    }

    public function test_show_returns_the_type(): void
    {
        $this->actingAsAdmin();
        $type = EventType::factory()->create();

        $this->getJson(self::BASE."/{$type->id}")->assertOk()->assertJsonPath('data.id', $type->id);
    }

    public function test_update_renames_and_regenerates_the_slug(): void
    {
        $this->actingAsAdmin();
        $type = EventType::factory()->create(['name' => 'Old Name', 'slug' => 'old-name']);

        $this->putJson(self::BASE."/{$type->id}", ['name' => 'New Name', 'is_active' => false])
            ->assertOk()
            ->assertJsonPath('message', 'Event type updated successfully')
            ->assertJsonPath('data.slug', 'new-name')
            ->assertJsonPath('data.is_active', false);
    }

    public function test_update_keeps_its_own_name(): void
    {
        $this->actingAsAdmin();
        $type = EventType::factory()->create(['name' => 'Yoga']);

        $this->putJson(self::BASE."/{$type->id}", ['name' => 'Yoga', 'color' => '#000000'])->assertOk();
    }

    public function test_delete_an_unused_type(): void
    {
        $this->actingAsAdmin();
        $type = EventType::factory()->create();

        $this->deleteJson(self::BASE."/{$type->id}")->assertOk()->assertJsonPath('message', 'Event type deleted successfully');

        $this->assertDatabaseMissing('event_types', ['id' => $type->id]);
    }

    // ------------------------------------------------------------ validation

    public function test_duplicate_name_is_rejected(): void
    {
        $this->actingAsAdmin();
        EventType::factory()->create(['name' => 'Yoga Flow']);

        $this->postJson(self::BASE, $this->payload())->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_bad_colour_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE, $this->payload(['color' => 'orange']))->assertStatus(422)->assertJsonValidationErrors(['color']);
        $this->postJson(self::BASE, $this->payload(['color' => '#FFF']))->assertStatus(422)->assertJsonValidationErrors(['color']);
    }

    // ------------------------------------------------------------ in use / options

    public function test_deleting_a_type_in_use_is_a_conflict(): void
    {
        $this->actingAsAdmin();
        $type = EventType::factory()->create();
        Event::factory()->for($type)->create();

        $this->assertApiError($this->deleteJson(self::BASE."/{$type->id}"), 409, 'EVENT_TYPE_IN_USE');
        $this->assertDatabaseHas('event_types', ['id' => $type->id]);
    }

    public function test_options_exclude_inactive_types(): void
    {
        $this->actingAsAdmin();
        $active = EventType::factory()->create(['name' => 'Zumba', 'color' => '#123456']);
        $inactive = EventType::factory()->inactive()->create();

        $response = $this->getJson(self::BASE.'/options')->assertOk();

        $values = collect($response->json('data'))->pluck('value');
        $this->assertTrue($values->contains($active->id));
        $this->assertFalse($values->contains($inactive->id));
        $this->assertContains(['value' => $active->id, 'title' => 'Zumba', 'color' => '#123456'], $response->json('data'));
    }

    // ------------------------------------------------------------ access

    public function test_member_token_gets_403(): void
    {
        $this->actingAsMember();
        $type = EventType::factory()->create();

        $this->assertApiError($this->getJson(self::BASE), 403);
        $this->assertApiError($this->getJson(self::BASE.'/options'), 403);
        $this->assertApiError($this->postJson(self::BASE, $this->payload()), 403);
        $this->assertApiError($this->deleteJson(self::BASE."/{$type->id}"), 403);
    }

    public function test_unknown_type_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->assertApiError($this->getJson(self::BASE.'/999999'), 404);
    }

    // ------------------------------------------------------------ helpers

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Yoga Flow',
            'color' => '#FF5722',
            'description' => 'Relaxed flow classes.',
        ], $overrides);
    }
}
