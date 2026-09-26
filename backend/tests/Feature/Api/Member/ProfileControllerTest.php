<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    public function test_returns_the_logged_in_member(): void
    {
        $member = $this->actingAsMember(['phone' => '+14155550199', 'address' => '1 Gym Street']);

        $this->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('message', 'Profile retrieved successfully')
            ->assertJsonPath('data.id', $member->id)
            ->assertJsonPath('data.phone', '+14155550199')
            ->assertJsonPath('data.address', '1 Gym Street')
            ->assertJsonMissingPath('data.password');
    }
}
