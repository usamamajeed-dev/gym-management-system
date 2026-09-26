<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\User;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    // ------------------------------------------------------------ login

    public function test_admin_logs_in_with_roles_and_permissions(): void
    {
        $admin = User::factory()->admin()->create();

        $this->login($admin->email)
            ->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $admin->id)
            ->assertJsonPath('data.user.roles', ['admin'])
            ->assertJsonStructure(['data' => ['token', 'expires_at', 'user' => ['permissions']]])
            ->assertJsonFragment(['members.approve']);
    }

    public function test_member_cannot_log_in_through_the_admin_endpoint(): void
    {
        $member = User::factory()->member()->approved()->create();

        $this->assertApiError($this->login($member->email), 401, 'INVALID_CREDENTIALS');
    }

    public function test_wrong_password_returns_invalid_credentials(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertApiError($this->login($admin->email, 'Wrong@12345'), 401, 'INVALID_CREDENTIALS');
    }

    // ------------------------------------------------------------ me / logout

    public function test_me_returns_the_admin_with_permissions(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $admin->id)
            ->assertJsonPath('data.roles', ['admin']);

        $this->assertCount(7, $response->json('data.permissions'));
    }

    public function test_member_token_cannot_use_admin_me(): void
    {
        $this->actingAsMember();

        $this->assertApiError($this->getJson('/api/admin/auth/me'), 403);
    }

    public function test_logout_revokes_the_token(): void
    {
        $admin = User::factory()->admin()->create();
        $token = $this->login($admin->email)->json('data.token');

        $this->withToken($token)->postJson('/api/admin/auth/logout')->assertOk();

        $this->app['auth']->forgetGuards();

        $this->assertApiError($this->withToken($token)->getJson('/api/admin/auth/me'), 401);
    }

    // ------------------------------------------------------------ helpers

    private function login(string $email, string $password = 'Password@123'): TestResponse
    {
        return $this->postJson('/api/admin/auth/login', ['email' => $email, 'password' => $password]);
    }
}
