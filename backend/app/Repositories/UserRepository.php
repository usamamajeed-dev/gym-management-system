<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\MemberStatus;
use App\Models\User;
use App\Repositories\Base\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class UserRepository extends BaseRepository
{
    private const MEMBER_SORTABLE = ['id', 'name', 'email', 'status', 'created_at', 'approved_at'];

    public function model(): string
    {
        return User::class;
    }

    public function findByEmail(string $email): ?User
    {
        /** @var User|null */
        return $this->query()->where('email', strtolower(trim($email)))->first();
    }

    /** Admin member list: filters status, is_active and search (name/email/phone/membership number). */
    public function membersIndex(Request $request): LengthAwarePaginator
    {
        $query = $this->membersQuery();

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $like = $this->likeValue($search);
            $query->where(fn (Builder $q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like)
                ->orWhere('membership_number', 'like', $like));
        }

        $status = $request->input('status');
        if (is_string($status) && in_array($status, MemberStatus::values(), true)) {
            $query->where('status', $status);
        }

        $isActive = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($request->filled('is_active') && $isActive !== null) {
            $query->where('is_active', $isActive);
        }

        $this->applySorting($query, $request, self::MEMBER_SORTABLE);

        return $query->paginate($this->pageSize($request));
    }

    /** Users with the member role; admins are never included. */
    public function membersQuery(): Builder
    {
        return $this->query()->role('member', 'api');
    }

    /** Re-read a member row with a write lock (call inside a transaction). */
    public function findMemberForUpdate(int $id): ?User
    {
        /** @var User|null */
        return $this->membersQuery()->whereKey($id)->lockForUpdate()->first();
    }
}
