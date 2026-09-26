<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Member;

use App\Models\User;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    private const PASSWORD = 'Password@123';

    // ------------------------------------------------------------ register

    public function test_register_creates_a_pending_member_without_a_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->payload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonMissingPath('data.token')
            ->assertJsonMissingPath('data.password');

        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();
        $this->assertTrue($user->isMember());
        $this->assertTrue($user->isPending());
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_register_normalises_phone_and_email(): void
    {
        $this->postJson('/api/v1/auth/register', $this->payload([
            'email' => '  Jane@Example.COM ',
            'phone' => '+1 (415) 555-2671',
        ]))->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'phone' => '+14155552671']);
    }

    public function test_register_rejects_a_duplicate_email(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $this->assertApiError($this->postJson('/api/v1/auth/register', $this->payload()), 422);
        $this->postJson('/api/v1/auth/register', $this->payload())->assertJsonValidationErrors(['email']);
    }

    public function test_register_rejects_an_email_owned_by_a_deleted_member(): void
    {
        User::factory()->create(['email' => 'jane@example.com'])->delete();

        $this->postJson('/api/v1/auth/register', $this->payload())->assertJsonValidationErrors(['email']);
    }

    public function test_register_rejects_a_weak_password(): void
    {
        $this->postJson('/api/v1/auth/register', $this->payload([
            'password' => 'password',
            'password_confirmation' => 'password',
        ]))->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_a_mismatched_password_confirmation(): void
    {
        $this->postJson('/api/v1/auth/register', $this->payload(['password_confirmation' => 'Other@1234']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_a_bad_phone(): void
    {
        $this->postJson('/api/v1/auth/register', $this->payload(['phone' => '0300-1234567']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_register_requires_name_email_phone_and_password(): void
    {
        $this->postJson('/api/v1/auth/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'phone', 'password']);
    }

    // ------------------------------------------------------------ login

    public function test_pending_member_cannot_log_in(): void
    {
        $member = $this->makeMember();

        $this->assertApiError($this->login($member->email), 403, 'MEMBER_PENDING');
    }

    public function test_rejected_member_gets_the_rejection_reason(): void
    {
        $member = User::factory()->member()->rejected('Missing ID proof.')->create();

        $response = $this->login($member->email);

        $this->assertApiError($response, 403, 'MEMBER_REJECTED');
        $response->assertJsonPath('errors.rejection_reason', 'Missing ID proof.');
    }

    public function test_inactive_member_cannot_log_in(): void
    {
        $member = User::factory()->member()->approved()->inactive()->create();

        $this->assertApiError($this->login($member->email), 403, 'MEMBER_INACTIVE');
    }

    public function test_wrong_password_returns_invalid_credentials(): void
    {
        $member = User::factory()->member()->approved()->create();

        $this->assertApiError($this->login($member->email, 'Wrong@12345'), 401, 'INVALID_CREDENTIALS');
    }

    public function test_unknown_email_returns_the_same_error_as_a_wrong_password(): void
    {
        $response = $this->login('nobody@example.com');

        $this->assertApiError($response, 401, 'INVALID_CREDENTIALS');
        $response->assertJsonPath('message', 'Invalid email or password.');
    }

    public function test_admin_cannot_log_in_through_the_member_endpoint(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertApiError($this->login($admin->email), 401, 'INVALID_CREDENTIALS');
    }

    public function test_approved_member_logs_in_and_gets_a_token(): void
    {
        $member = User::factory()->member()->approved()->create(['last_login_at' => null]);

        $this->login(strtoupper($member->email))
            ->assertOk()
            ->assertJsonPath('message', 'Logged in successfully')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $member->id)
            ->assertJsonStructure(['data' => ['token', 'token_type', 'expires_at', 'user' => ['id', 'email', 'status']]]);

        $this->assertNotNull($member->fresh()->last_login_at);
    }

    public function test_login_validates_input(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    // ------------------------------------------------------------ me / logout

    public function test_me_returns_the_current_member(): void
    {
        $member = $this->actingAsMember();

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('message', 'Profile retrieved successfully')
            ->assertJsonPath('data.id', $member->id)
            ->assertJsonPath('data.email', $member->email);
    }

    public function test_me_requires_a_token(): void
    {
        $this->assertApiError($this->getJson('/api/v1/auth/me'), 401);
    }

    public function test_request_without_token_or_accept_header_gets_401_json(): void
    {
        $this->call('GET', '/api/v1/auth/me')
            ->assertStatus(401)
            ->assertExactJson(['success' => false, 'message' => 'Unauthenticated.']);
    }

    public function test_logout_revokes_the_token(): void
    {
        $member = User::factory()->member()->approved()->create();
        $token = $this->login($member->email)->json('data.token');

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk();

        $this->withToken($token)->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully');

        $this->app['auth']->forgetGuards();

        $this->assertApiError($this->withToken($token)->getJson('/api/v1/auth/me'), 401);
    }

    public function test_member_deactivated_after_login_is_blocked(): void
    {
        $member = $this->actingAsMember();
        $member->updateQuietly(['is_active' => false]);

        $this->assertApiError($this->getJson('/api/v1/auth/me'), 403, 'MEMBER_INACTIVE');
    }

    public function test_admin_token_cannot_use_member_routes(): void
    {
        $this->actingAsAdmin();

        $this->assertApiError($this->getJson('/api/v1/auth/me'), 403);
    }

    // ------------------------------------------------------------ helpers

    private function login(string $email, string $password = self::PASSWORD): TestResponse
    {
        return $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => $password]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '+14155552671',
            'password' => 'Secret@123',
            'password_confirmation' => 'Secret@123',
            'date_of_birth' => '1995-04-12',
            'gender' => 'female',
            'address' => '1 Main Street',
            'emergency_contact_name' => 'John Doe',
            'emergency_contact_phone' => '+14155550000',
        ], $overrides);
    }
}
