<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Gender;
use App\Enums\MemberStatus;
use App\Enums\RoleName;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * Admins and gym members. Members go through an approval process
 * (status pending → approved | rejected) and can be activated/deactivated.
 */
class User extends Authenticatable implements OAuthenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    /** Every role and permission lives on the Passport "api" guard. */
    protected string $guard_name = 'api';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'date_of_birth',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'membership_number',
        'status',
        'is_active',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
        'last_login_at',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => MemberStatus::class,
            'gender' => Gender::class,
            'is_active' => 'boolean',
            'date_of_birth' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'approved_by')->withTrashed();
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'rejected_by')->withTrashed();
    }

    /** Users with the member role (admins excluded). */
    public function scopeMembers(Builder $query): Builder
    {
        return $query->role(RoleName::MEMBER->value, 'api');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(RoleName::ADMIN->value, 'api');
    }

    public function isMember(): bool
    {
        return $this->hasRole(RoleName::MEMBER->value, 'api');
    }

    public function isPending(): bool
    {
        return $this->status === MemberStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === MemberStatus::APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === MemberStatus::REJECTED;
    }

    /** A member may use the app only when approved and active. */
    public function canLogInAsMember(): bool
    {
        return $this->isApproved() && $this->is_active;
    }
}
