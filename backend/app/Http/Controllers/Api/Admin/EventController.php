<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Admin\Event\StoreEventRequest;
use App\Http\Requests\Admin\Event\UpdateEventRequest;
use App\Http\Resources\Event\EventResource;
use App\Http\Resources\Event\EventResourceCollection;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin Portal — Events
 *
 * Gym events with an optional image. Send dates as local gym time ("2026-10-05 18:00")
 * or ISO-8601 with an offset. Create and update with an image as multipart; for updates,
 * use POST with _method=PUT.
 *
 * @authenticated
 */
class EventController extends BaseController
{
    public function __construct(private EventService $eventService) {}

    /**
     * List events
     *
     * @queryParam search string Title or location. Example: yoga
     * @queryParam event_type_id integer Filter by type. Example: 1
     * @queryParam is_published boolean Published (true) or draft (false). Example: true
     * @queryParam from string Start date (Y-m-d, gym time), inclusive. Example: 2026-10-01
     * @queryParam to string End date (Y-m-d, gym time), inclusive. Example: 2026-10-31
     * @queryParam column string Sort column: id, title, starts_at, created_at. Example: starts_at
     * @queryParam dir string asc or desc. Example: asc
     * @queryParam length integer Page size (max 100). Example: 10
     * @queryParam page integer Page number. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse(
            new EventResourceCollection($this->eventService->list($request)),
            'Events retrieved successfully',
        );
    }

    /**
     * Create an event
     */
    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = $this->eventService->createEvent($request->safe()->except('image'), $request->file('image'));

        return $this->successResponse(new EventResource($event), 'Event created successfully', 201);
    }

    /**
     * Show an event
     */
    public function show(Event $event): JsonResponse
    {
        return $this->successResponse(new EventResource($this->eventService->show($event)), 'Event retrieved successfully');
    }

    /**
     * Update an event
     *
     * Partial update. Send remove_image=1 to delete the current image.
     */
    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $updated = $this->eventService->updateEvent($event, $request->safe()->except('image'), $request->file('image'));

        return $this->successResponse(new EventResource($updated), 'Event updated successfully');
    }

    /**
     * Delete an event
     *
     * Also deletes its image.
     */
    public function destroy(Event $event): JsonResponse
    {
        $this->eventService->deleteEvent($event);

        return $this->successResponse(null, 'Event deleted successfully');
    }
}
