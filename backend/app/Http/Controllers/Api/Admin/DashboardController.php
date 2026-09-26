<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Http\JsonResponse;

/**
 * @group Admin Portal — Dashboard
 *
 * @authenticated
 */
class DashboardController extends BaseController
{
    public function __construct(private AdminDashboardService $dashboardService) {}

    /**
     * Overview
     *
     * Member counts, registrations for the last six months, the oldest pending and newest members,
     * event and content counts with the next events and latest content, and the gym's open status.
     * Cached for up to 60 seconds; changes made through the API refresh it immediately.
     *
     * @response 200 {"success":true,"message":"Dashboard retrieved successfully","data":{"members":{"total":120,"pending":7,"approved":105,"rejected":8,"active":98,"inactive":7,"new_this_month":12},"registrations_by_month":[{"month":"2026-05","count":9},{"month":"2026-06","count":14},{"month":"2026-07","count":0},{"month":"2026-08","count":21},{"month":"2026-09","count":17},{"month":"2026-10","count":12}],"pending_members":[],"recent_members":[],"events":{"this_month":6,"upcoming":4,"drafts":2,"next":[]},"contents":{"news_published":14,"policies_published":5,"drafts":3,"archived":20,"latest":[]},"gym":{"is_open_now":true,"today_timing":{"day_of_week":1,"day_name":"Monday","is_closed":false,"opens_at":"06:00","closes_at":"22:00","updated_at":"2026-10-01T09:00:00+00:00"},"timezone":"UTC"}}}
     */
    public function index(): JsonResponse
    {
        return $this->successResponse($this->dashboardService->build(), 'Dashboard retrieved successfully');
    }
}
