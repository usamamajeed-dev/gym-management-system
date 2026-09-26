<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use App\Models\User;
use Tests\TestCase;

/** Access rules shared by every member read endpoint. */
class MemberAccessTest extends TestCase
{
    private const ROUTES = [
        '/api/v1/dashboard',
        '/api/v1/gym-timings',
        '/api/v1/events',
        '/api/v1/contents?type=news',
        '/api/v1/profile',
    ];

    public function test_admin_token_gets_403(): void
    {
        $this->actingAsAdmin();

        foreach (self::ROUTES as $uri) {
            $this->assertApiError($this->getJson($uri), 403);
        }
    }

    public function test_no_token_gets_401(): void
    {
        foreach (self::ROUTES as $uri) {
            $this->assertApiError($this->getJson($uri), 401);
        }
    }

    public function test_pending_member_has_no_token_so_gets_401(): void
    {
        $pending = $this->makeMember();

        $this->assertApiError(
            $this->postJson('/api/v1/auth/login', ['email' => $pending->email, 'password' => 'Password@123']),
            403,
            'MEMBER_PENDING',
        );

        foreach (self::ROUTES as $uri) {
            $this->assertApiError($this->getJson($uri), 401);
        }
    }

    public function test_member_deactivated_after_login_gets_403(): void
    {
        $member = $this->actingAsMember();
        $member->updateQuietly(['is_active' => false]);

        foreach (self::ROUTES as $uri) {
            $this->assertApiError($this->getJson($uri), 403, 'MEMBER_INACTIVE');
        }
    }

    public function test_deactivated_member_with_a_real_token_gets_401(): void
    {
        $member = User::factory()->member()->approved()->create();
        $token = $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'Password@123'])
            ->json('data.token');

        $member->update(['is_active' => false]);
        $this->app['auth']->forgetGuards();

        $this->assertApiError($this->withToken($token)->getJson('/api/v1/dashboard'), 401);
    }
}
