<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\Auth\AdminUserResource;
use App\Http\Resources\Auth\AuthTokenResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin Portal — Auth
 *
 * Admin login for the portal. Only users with the admin role can log in here.
 */
class AuthController extends BaseController
{
    public function __construct(private AuthService $authService) {}

    /**
     * Log in
     *
     * Returns a Bearer token plus the admin's roles and permissions.
     *
     * @unauthenticated
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->loginAdmin($request->validated());

        return $this->successResponse(
            new AuthTokenResource([...$result, 'user' => new AdminUserResource($result['user'])]),
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
     * Current admin
     *
     * Includes the admin's roles and permissions.
     *
     * @authenticated
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(new AdminUserResource($request->user()), 'Profile retrieved successfully');
    }
}
