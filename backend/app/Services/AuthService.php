<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ErrorCode;
use App\Enums\MemberStatus;
use App\Enums\RoleName;
use App\Exceptions\ApiException;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\Base\BaseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService extends BaseService
{
    public function __construct(private UserRepository $userRepository)
    {
        parent::__construct($this->userRepository);
    }

    /** Creates a pending, inactive member. No token is issued until an admin approves them. */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            /** @var User $user */
            $user = $this->userRepository->create([
                ...$data,
                'status' => MemberStatus::PENDING,
                'is_active' => false,
            ]);

            $user->assignRole(RoleName::MEMBER->value);

            return $user;
        });
    }

    /**
     * Log a member in. Refusals are checked in order: credentials,
     * pending, rejected, inactive.
     *
     * @return array{token: string, expires_at: mixed, user: User}
     */
    public function loginMember(array $credentials): array
    {
        $user = $this->verifyCredentials($credentials);

        if (! $user->isMember()) {
            throw $this->invalidCredentials();
        }

        if ($user->isPending()) {
            throw new ApiException(
                'Your registration is awaiting admin approval.',
                403,
                null,
                ErrorCode::MEMBER_PENDING->value,
            );
        }

        if ($user->isRejected()) {
            throw new ApiException(
                'Your registration was not approved.',
                403,
                ['rejection_reason' => $user->rejection_reason],
                ErrorCode::MEMBER_REJECTED->value,
            );
        }

        if (! $user->is_active) {
            throw ApiException::forbidden(
                'Your membership is inactive. Please contact the gym.',
                ErrorCode::MEMBER_INACTIVE->value,
            );
        }

        return $this->issueToken($user, 'member-app');
    }

    /** @return array{token: string, expires_at: mixed, user: User} */
    public function loginAdmin(array $credentials): array
    {
        $user = $this->verifyCredentials($credentials);

        if (! $user->isAdmin()) {
            throw $this->invalidCredentials();
        }

        return $this->issueToken($user, 'admin-portal');
    }

    /** Revokes the token used for this request only. */
    public function logout(User $user): void
    {
        $user->token()?->revoke();
    }

    /**
     * The same error for an unknown email, a wrong password and a wrong portal,
     * so the response never reveals whether an account exists.
     */
    private function verifyCredentials(array $credentials): User
    {
        $user = $this->userRepository->findByEmail((string) $credentials['email']);

        if ($user === null || ! Hash::check((string) $credentials['password'], $user->password)) {
            throw $this->invalidCredentials();
        }

        return $user;
    }

    private function invalidCredentials(): ApiException
    {
        return ApiException::unauthorized('Invalid email or password.', ErrorCode::INVALID_CREDENTIALS->value);
    }

    /** @return array{token: string, expires_at: mixed, user: User} */
    private function issueToken(User $user, string $name): array
    {
        $this->userRepository->update($user, ['last_login_at' => now()]);

        $result = $user->createToken($name);

        return [
            'token' => $result->accessToken,
            'expires_at' => $result->getToken()?->expires_at,
            'user' => $user,
        ];
    }
}
