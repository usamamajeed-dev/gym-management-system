<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\Member\MemberResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Member App — Profile
 *
 * @authenticated
 */
class ProfileController extends BaseController
{
    /**
     * My profile
     *
     * The logged-in member's details, including membership number and status.
     */
    public function show(Request $request): JsonResponse
    {
        return $this->successResponse(new MemberResource($request->user()), 'Profile retrieved successfully');
    }
}
