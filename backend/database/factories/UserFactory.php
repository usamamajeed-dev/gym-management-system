<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\MemberStatus;
use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Default state: an approved, active user with no role.
 * Chain member() / admin() to assign a role, and pending() / rejected() / inactive() for other states.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+1415555'.fake()->unique()->numerify('####'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('Password@123'),
            'remember_token' => Str::random(10),
            'status' => MemberStatus::APPROVED,
            'is_active' => true,
            'approved_at' => now(),
        ];
    }

    public function member(): static
    {
        return $this->afterCreating(fn (User $user) => $user->assignRole(RoleName::MEMBER->value));
    }

    public function admin(): static
    {
        return $this->afterCreating(fn (User $user) => $user->assignRole(RoleName::ADMIN->value));
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MemberStatus::PENDING,
            'is_active' => false,
            'approved_at' => null,
            'membership_number' => null,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MemberStatus::APPROVED,
            'is_active' => true,
            'approved_at' => now(),
        ]);
    }

    public function rejected(string $reason = 'Incomplete registration details.'): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MemberStatus::REJECTED,
            'is_active' => false,
            'approved_at' => null,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /** Approved but deactivated. */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
