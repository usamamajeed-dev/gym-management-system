<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\GymTiming\GymTimingResource;
use App\Services\GymTimingService;
use App\Support\DateFormat;
use Illuminate\Http\JsonResponse;

/**
 * @group Member App — Gym Timings
 *
 * @authenticated
 */
class GymTimingController extends BaseController
{
    public function __construct(private GymTimingService $gymTimingService) {}

    /**
     * Weekly opening hours
     *
     * Seven days, Monday first, with today's day (0 = Sunday … 6 = Saturday), whether the gym
     * is open now, and the timezone the times are in.
     */
    public function index(): JsonResponse
    {
        return $this->successResponse([
            'timings' => GymTimingResource::collection($this->gymTimingService->week()),
            'today_day_of_week' => $this->gymTimingService->todayDayOfWeek(),
            'is_open_now' => $this->gymTimingService->isOpenNow(),
            'timezone' => DateFormat::timezone(),
        ], 'Gym timings retrieved successfully');
    }
}
