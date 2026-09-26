<?php

declare(strict_types=1);

namespace App\Http\Resources\Member;

use App\Models\User;
use App\Support\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'date_of_birth' => DateFormat::date($this->date_of_birth),
            'gender' => $this->gender?->value,
            'address' => $this->address,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'membership_number' => $this->membership_number,
            'status' => $this->status?->value,
            'is_active' => (bool) $this->is_active,
            'approved_at' => DateFormat::iso($this->approved_at),
            'rejected_at' => DateFormat::iso($this->rejected_at),
            'rejection_reason' => $this->rejection_reason,
            'last_login_at' => DateFormat::iso($this->last_login_at),
            'created_at' => DateFormat::iso($this->created_at),
        ];
    }
}
