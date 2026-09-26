<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Admin\EventType\StoreEventTypeRequest;
use App\Http\Requests\Admin\EventType\UpdateEventTypeRequest;
use App\Http\Resources\EventType\EventTypeOptionResource;
use App\Http\Resources\EventType\EventTypeResource;
use App\Http\Resources\EventType\EventTypeResourceCollection;
use App\Models\EventType;
use App\Services\EventTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin Portal — Event Types
 *
 * Kinds of gym events (Class, Workshop, Competition…) with a badge colour.
 * A type that is used by events can't be deleted (409 EVENT_TYPE_IN_USE); deactivate it instead.
 *
 * @authenticated
 */
class EventTypeController extends BaseController
{
    public function __construct(private EventTypeService $eventTypeService) {}

    /**
     * Event type options
     *
     * Active types for dropdowns: [{ value, title, color }], ordered by name.
     */
    public function options(): JsonResponse
    {
        return $this->successResponse(
            EventTypeOptionResource::collection($this->eventTypeService->options()),
            'Event type options retrieved successfully',
        );
    }

    /**
     * List event types
     *
     * @queryParam search string Filter by name. Example: class
     * @queryParam column string Sort column: id, name, created_at. Example: name
     * @queryParam dir string asc or desc. Example: asc
     * @queryParam length integer Page size (max 100). Example: 10
     * @queryParam page integer Page number. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse(
            new EventTypeResourceCollection($this->eventTypeService->list($request)),
            'Event types retrieved successfully',
        );
    }

    /**
     * Create an event type
     */
    public function store(StoreEventTypeRequest $request): JsonResponse
    {
        return $this->successResponse(
            new EventTypeResource($this->eventTypeService->createType($request->validated())),
            'Event type created successfully',
            201,
        );
    }

    /**
     * Show an event type
     */
    public function show(EventType $eventType): JsonResponse
    {
        return $this->successResponse(
            new EventTypeResource($this->eventTypeService->show($eventType)),
            'Event type retrieved successfully',
        );
    }

    /**
     * Update an event type
     */
    public function update(UpdateEventTypeRequest $request, EventType $eventType): JsonResponse
    {
        return $this->successResponse(
            new EventTypeResource($this->eventTypeService->updateType($eventType, $request->validated())),
            'Event type updated successfully',
        );
    }

    /**
     * Delete an event type
     */
    public function destroy(EventType $eventType): JsonResponse
    {
        $this->eventTypeService->deleteType($eventType);

        return $this->successResponse(null, 'Event type deleted successfully');
    }
}
