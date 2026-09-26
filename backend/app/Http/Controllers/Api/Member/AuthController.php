<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\Auth\AuthTokenResource;
use App\Http\Resources\Member\MemberResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Member App — Auth
 *
 * Member registration and login. A new member stays pending until an admin
 * approves them; only approved, active members can log in.
 */
class AuthController extends BaseController
{
    public function __construct(private AuthService $authService) {}

    /**
     * Register
     *
     * Submit a membership registration. No token is returned: the member can
     * log in once an admin approves the registration.
     *
     * @unauthenticated
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $member = $this->authService->register($request->validated());

        return $this->successResponse(
            new MemberResource($member),
            'Registration submitted. You can log in once an admin approves your membership.',
            201,
        );
    }

    /**
     * Log in
     *
     * Returns a Bearer token for an approved, active member. Pending, rejected
     * and inactive members get 403 with error_code MEMBER_PENDING,
     * MEMBER_REJECTED (plus errors.rejection_reason) or MEMBER_INACTIVE.
     *
     * @unauthenticated
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->loginMember($request->validated());

        return $this->successResponse(
            new AuthTokenResource([...$result, 'user' => new MemberResource($result['user'])]),
            'Logged in successfully',
        );
    }

    /**
     * Log out
     *
     * Revokes the token used for this request.
     *
     * @authenticated
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Current member
     *
     * @authenticated
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(new MemberResource($request->user()), 'Profile retrieved successfully');
    }
}
