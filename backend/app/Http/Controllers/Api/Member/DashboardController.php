<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Base\BaseController;
use App\Services\Member\MemberDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Member App — Dashboard
 *
 * @authenticated
 */
class DashboardController extends BaseController
{
    public function __construct(private MemberDashboardService $dashboardService) {}

    /**
     * Home screen
     *
     * The member, gym name and timezone, today's opening hours, whether the gym is open now,
     * the next 3 events, the latest 3 news items, and counts for this month's events and policies.
     *
     * @response 200 {"success":true,"message":"Dashboard retrieved successfully","data":{"member":{"id":2,"name":"Jane Doe","membership_number":"GYM-2026-00002","status":"approved","is_active":true},"gym":{"name":"My Gym","timezone":"UTC"},"today_timing":{"day_of_week":1,"day_name":"Monday","is_closed":false,"opens_at":"06:00","closes_at":"22:00","updated_at":"2026-09-26T18:00:00+00:00"},"is_open_now":true,"upcoming_events":[],"latest_news":[],"counts":{"events_this_month":5,"policies":4}}}
     */
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->dashboardService->build($request->user()), 'Dashboard retrieved successfully');
    }
}
