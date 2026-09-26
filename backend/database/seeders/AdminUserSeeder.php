<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\MemberStatus;
use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the admin account from config('gym.admin') (ADMIN_* env keys).
 * There is no admin self-signup.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => strtolower(trim((string) config('gym.admin.email')))],
            [
                'name' => config('gym.admin.name'),
                'password' => config('gym.admin.password'),
                'status' => MemberStatus::APPROVED,
                'is_active' => true,
                'approved_at' => now(),
            ],
        );

        $admin->assignRole(RoleName::ADMIN->value);
    }
}
