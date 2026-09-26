<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Admin\GymTiming\UpdateGymTimingsRequest;
use App\Http\Resources\GymTiming\GymTimingResource;
use App\Services\GymTimingService;
use App\Support\DateFormat;
use Illuminate\Http\JsonResponse;

/**
 * @group Admin Portal — Gym Timings
 *
 * Weekly opening hours. Times are "HH:mm" in the gym's timezone.
 *
 * @authenticated
 */
class GymTimingController extends BaseController
{
    public function __construct(private GymTimingService $gymTimingService) {}

    /**
     * Get the week
     *
     * All seven days, Monday first, with the gym timezone and whether it is open now.
     */
    public function index(): JsonResponse
    {
        return $this->successResponse($this->payload(), 'Gym timings retrieved successfully');
    }

    /**
     * Update the week
     *
     * Send all seven days. A closed day stores no times; an open day needs closes_at after opens_at.
     */
    public function update(UpdateGymTimingsRequest $request): JsonResponse
    {
        $this->gymTimingService->updateWeek($request->validated('timings'));

        return $this->successResponse($this->payload(), 'Gym timings updated successfully');
    }

    private function payload(): array
    {
        return [
            'timings' => GymTimingResource::collection($this->gymTimingService->week()),
            'timezone' => DateFormat::timezone(),
            'is_open_now' => $this->gymTimingService->isOpenNow(),
        ];
    }
}
