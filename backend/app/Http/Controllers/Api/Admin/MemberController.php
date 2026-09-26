<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Admin\Member\RejectMemberRequest;
use App\Http\Requests\Admin\Member\UpdateMemberRequest;
use App\Http\Resources\Member\MemberResource;
use App\Http\Resources\Member\MemberResourceCollection;
use App\Services\Admin\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin Portal — Members
 *
 * Manage gym members and their registrations. Approve or reject pending
 * registrations, activate or deactivate approved members. Invalid transitions
 * return 409 with error_code INVALID_MEMBER_TRANSITION.
 *
 * @authenticated
 */
class MemberController extends BaseController
{
    public function __construct(private MemberService $memberService) {}

    /**
     * List members
     *
     * @queryParam search string Name, email, phone or membership number. Example: jane
     * @queryParam status string pending, approved or rejected. Example: pending
     * @queryParam is_active boolean Filter by active flag. Example: true
     * @queryParam column string Sort column: id, name, email, status, created_at, approved_at. Example: created_at
     * @queryParam dir string asc or desc. Example: desc
     * @queryParam length integer Page size (max 100). Example: 10
     * @queryParam page integer Page number. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        return $this->successResponse(
            new MemberResourceCollection($this->memberService->list($request)),
            'Members retrieved successfully',
        );
    }

    /**
     * Show a member
     */
    public function show(int $member): JsonResponse
    {
        return $this->successResponse(
            new MemberResource($this->memberService->findMember($member)),
            'Member retrieved successfully',
        );
    }

    /**
     * Update a member's profile
     *
     * Profile fields only; use the approval actions to change status.
     */
    public function update(UpdateMemberRequest $request, int $member): JsonResponse
    {
        $updated = $this->memberService->updateMember($this->memberService->findMember($member), $request->validated());

        return $this->successResponse(new MemberResource($updated), 'Member updated successfully');
    }

    /**
     * Delete a member
     *
     * Soft-deletes the member and revokes their tokens.
     */
    public function destroy(int $member): JsonResponse
    {
        $this->memberService->deleteMember($this->memberService->findMember($member));

        return $this->successResponse(null, 'Member deleted successfully');
    }

    /**
     * Approve a member
     *
     * Allowed for pending or rejected members. Activates the member and assigns a membership number.
     */
    public function approve(Request $request, int $member): JsonResponse
    {
        $approved = $this->memberService->approve($this->memberService->findMember($member), $request->user());

        return $this->successResponse(new MemberResource($approved), 'Member approved successfully');
    }

    /**
     * Reject a member
     *
     * Allowed for pending members only. The reason is shown to the member when they try to log in.
     */
    public function reject(RejectMemberRequest $request, int $member): JsonResponse
    {
        $rejected = $this->memberService->reject(
            $this->memberService->findMember($member),
            $request->user(),
            $request->validated('reason'),
        );

        return $this->successResponse(new MemberResource($rejected), 'Member rejected successfully');
    }

    /**
     * Activate a member
     *
     * Allowed for approved, inactive members.
     */
    public function activate(int $member): JsonResponse
    {
        $activated = $this->memberService->activate($this->memberService->findMember($member));

        return $this->successResponse(new MemberResource($activated), 'Member activated successfully');
    }

    /**
     * Deactivate a member
     *
     * Allowed for approved, active members. Revokes their tokens, signing them out of the app.
     */
    public function deactivate(int $member): JsonResponse
    {
        $deactivated = $this->memberService->deactivate($this->memberService->findMember($member));

        return $this->successResponse(new MemberResource($deactivated), 'Member deactivated successfully');
    }
}
