<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Member\EventIndexRequest;
use App\Http\Resources\Event\EventResource;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\JsonResponse;

/**
 * @group Member App — Events
 *
 * Published events only.
 *
 * @authenticated
 */
class EventController extends BaseController
{
    public function __construct(private EventService $eventService) {}

    /**
     * Events in a month
     *
     * Published events that overlap the month (gym time), earliest first. Not paginated.
     *
     * @queryParam month string The month as YYYY-MM. Defaults to the current month. Example: 2026-10
     */
    public function index(EventIndexRequest $request): JsonResponse
    {
        $month = $request->month();

        return $this->successResponse([
            'month' => $month->format('Y-m'),
            'events' => EventResource::collection($this->eventService->publishedForMonth($month)),
        ], 'Events retrieved successfully');
    }

    /**
     * Show an event
     *
     * 404 if the event doesn't exist or isn't published.
     */
    public function show(Event $event): JsonResponse
    {
        return $this->successResponse(
            new EventResource($this->eventService->findPublished($event)),
            'Event retrieved successfully',
        );
    }
}
