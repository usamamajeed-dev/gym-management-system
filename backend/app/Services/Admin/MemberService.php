<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\ErrorCode;
use App\Enums\MemberStatus;
use App\Exceptions\ApiException;
use App\Models\User;
use App\Notifications\MemberApprovedNotification;
use App\Notifications\MemberRejectedNotification;
use App\Repositories\UserRepository;
use App\Services\Base\BaseService;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin-side member management and the approval process:
 *
 *   pending  → approve → approved + active
 *   pending  → reject  → rejected
 *   rejected → approve → approved + active
 *   approved + active ⇄ deactivate / activate
 *
 * Every transition re-reads the member with a row lock inside a transaction,
 * so two admins acting at once can't apply the same transition twice.
 */
class MemberService extends BaseService
{
    public function __construct(private UserRepository $userRepository)
    {
        parent::__construct($this->userRepository);
    }

    public function list(Request $request): LengthAwarePaginator
    {
        return $this->userRepository->membersIndex($request);
    }

    /** A member-role user, or 404. Admins can never be targeted. */
    public function findMember(int $id): User
    {
        /** @var User|null $member */
        $member = $this->userRepository->membersQuery()->whereKey($id)->first();

        if ($member === null) {
            throw ApiException::notFound('Member not found');
        }

        return $member;
    }

    /** Approves the member and, once committed, emails them. */
    public function approve(User $member, User $admin): User
    {
        $approved = $this->transition($member, function (User $member) use ($admin): void {
            if (! in_array($member->status, [MemberStatus::PENDING, MemberStatus::REJECTED], true)) {
                throw $this->invalidTransition('Only pending or rejected members can be approved.');
            }

            $this->userRepository->update($member, [
                'status' => MemberStatus::APPROVED,
                'is_active' => true,
                'approved_at' => now(),
                'approved_by' => $admin->id,
                'rejected_at' => null,
                'rejected_by' => null,
                'rejection_reason' => null,
                'membership_number' => $member->membership_number ?? $this->membershipNumber($member),
            ]);
        });

        $approved->notify(new MemberApprovedNotification);

        return $approved;
    }

    /** Rejects the member and, once committed, emails them the reason. */
    public function reject(User $member, User $admin, string $reason): User
    {
        $rejected = $this->transition($member, function (User $member) use ($admin, $reason): void {
            if (! $member->isPending()) {
                throw $this->invalidTransition('Only pending members can be rejected.');
            }

            $this->userRepository->update($member, [
                'status' => MemberStatus::REJECTED,
                'is_active' => false,
                'rejected_at' => now(),
                'rejected_by' => $admin->id,
                'rejection_reason' => $reason,
            ]);
        });

        $rejected->notify(new MemberRejectedNotification);

        return $rejected;
    }

    public function activate(User $member): User
    {
        return $this->transition($member, function (User $member): void {
            if (! $member->isApproved() || $member->is_active) {
                throw $this->invalidTransition('Only approved, inactive members can be activated.');
            }

            $this->userRepository->update($member, ['is_active' => true]);
        });
    }

    /** Deactivating also revokes every token, so the member is signed out of the app immediately. */
    public function deactivate(User $member): User
    {
        return $this->transition($member, function (User $member): void {
            if (! $member->isApproved() || ! $member->is_active) {
                throw $this->invalidTransition('Only approved, active members can be deactivated.');
            }

            $this->userRepository->update($member, ['is_active' => false]);
            $this->revokeTokens($member);
        });
    }

    /** Profile fields only; status and activation change through the transitions above. */
    public function updateMember(User $member, array $data): User
    {
        return DB::transaction(function () use ($member, $data): User {
            /** @var User $updated */
            $updated = $this->userRepository->update($member, $data);
            AdminDashboardService::forgetCache();

            return $updated;
        });
    }

    /** Revokes the member's tokens, then soft-deletes them. */
    public function deleteMember(User $member): void
    {
        DB::transaction(function () use ($member): void {
            $this->revokeTokens($member);
            $this->userRepository->delete($member);
            AdminDashboardService::forgetCache();
        });
    }

    /** Run $change on a freshly locked copy of the member and return it. */
    private function transition(User $member, Closure $change): User
    {
        return DB::transaction(function () use ($member, $change): User {
            $locked = $this->userRepository->findMemberForUpdate($member->id)
                ?? throw ApiException::notFound('Member not found');

            $change($locked);
            AdminDashboardService::forgetCache();

            return $locked;
        });
    }

    private function revokeTokens(User $member): void
    {
        $member->tokens()->update(['revoked' => true]);
    }

    /** e.g. GYM-2026-00042 */
    private function membershipNumber(User $member): string
    {
        return sprintf('GYM-%s-%05d', now()->year, $member->id);
    }

    private function invalidTransition(string $message): ApiException
    {
        return ApiException::conflict($message, null, ErrorCode::INVALID_MEMBER_TRANSITION->value);
    }
}
