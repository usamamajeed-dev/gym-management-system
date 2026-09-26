<?php

declare(strict_types=1);

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Laravel\Passport\Passport;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\AssertsApiResponses;

abstract class TestCase extends BaseTestCase
{
    use AssertsApiResponses;
    use CreatesApplication;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        Storage::fake('public');
        Notification::fake();
    }

    /** Authenticate as a given user for API requests (Passport). */
    protected function actingAsApiUser(User $user, array $scopes = []): static
    {
        Passport::actingAs($user, $scopes, 'api');

        return $this;
    }

    /** Approved, active admin (role on the api guard). */
    protected function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAsApiUser($admin);

        return $admin;
    }

    /** Approved, active member. */
    protected function actingAsMember(array $attributes = []): User
    {
        $member = User::factory()->member()->approved()->create($attributes);
        $this->actingAsApiUser($member);

        return $member;
    }

    /** Member in any state, not authenticated. Pending by default. */
    protected function makeMember(array $attributes = []): User
    {
        return User::factory()->member()->pending()->create($attributes);
    }

    // ------------------------------------------------------------ JSON requests

    /** The plain request helpers always ask for JSON, so errors never render as HTML. */
    public function get($uri, array $headers = []): TestResponse
    {
        return parent::get($uri, $this->withJsonAccept($headers));
    }

    public function post($uri, array $data = [], array $headers = []): TestResponse
    {
        return parent::post($uri, $data, $this->withJsonAccept($headers));
    }

    public function put($uri, array $data = [], array $headers = []): TestResponse
    {
        return parent::put($uri, $data, $this->withJsonAccept($headers));
    }

    public function patch($uri, array $data = [], array $headers = []): TestResponse
    {
        return parent::patch($uri, $data, $this->withJsonAccept($headers));
    }

    public function delete($uri, array $data = [], array $headers = []): TestResponse
    {
        return parent::delete($uri, $data, $this->withJsonAccept($headers));
    }

    private function withJsonAccept(array $headers): array
    {
        return array_merge(['Accept' => 'application/json'], $headers);
    }
}
