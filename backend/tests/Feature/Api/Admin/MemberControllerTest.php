<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Models\User;
use App\Notifications\MemberApprovedNotification;
use App\Notifications\MemberRejectedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MemberControllerTest extends TestCase
{
    private const BASE = '/api/admin/members';

    // ------------------------------------------------------------ access

    public function test_member_token_gets_403_on_every_route(): void
    {
        $target = $this->makeMember();
        $this->actingAsMember();

        foreach ($this->routes($target->id) as [$method, $uri, $data]) {
            $this->assertApiError($this->json($method, $uri, $data), 403);
        }
    }

    public function test_every_route_requires_a_token(): void
    {
        $target = $this->makeMember();

        foreach ($this->routes($target->id) as [$method, $uri, $data]) {
            $this->assertApiError($this->json($method, $uri, $data), 401);
        }
    }

    // ------------------------------------------------------------ list

    public function test_list_includes_members_only(): void
    {
        $admin = $this->actingAsAdmin();
        $member = $this->makeMember();

        $response = $this->getJson(self::BASE);

        $this->assertPaginated($response, 1);
        $ids = collect($response->json('data.list'))->pluck('id');
        $this->assertTrue($ids->contains($member->id));
        $this->assertFalse($ids->contains($admin->id));
    }

    public function test_list_filters_by_status(): void
    {
        $this->actingAsAdmin();
        $pending = $this->makeMember();
        User::factory()->member()->approved()->create();

        $response = $this->getJson(self::BASE.'?status=pending');

        $this->assertPaginated($response, 1);
        $response->assertJsonPath('data.list.0.id', $pending->id);
    }

    public function test_list_ignores_an_unknown_status(): void
    {
        $this->actingAsAdmin();
        $this->makeMember();
        User::factory()->member()->approved()->create();

        $this->assertPaginated($this->getJson(self::BASE.'?status=bogus'), 2);
    }

    public function test_list_filters_by_active_flag(): void
    {
        $this->actingAsAdmin();
        User::factory()->member()->approved()->create();
        $inactive = User::factory()->member()->approved()->inactive()->create();

        $response = $this->getJson(self::BASE.'?is_active=false');

        $this->assertPaginated($response, 1);
        $response->assertJsonPath('data.list.0.id', $inactive->id);
    }

    public function test_list_searches_name_email_phone_and_membership_number(): void
    {
        $this->actingAsAdmin();
        $jane = $this->makeMember(['name' => 'Jane Runner', 'email' => 'jane@example.com', 'phone' => '+14155557777']);
        $numbered = User::factory()->member()->approved()->create(['membership_number' => 'GYM-2026-00077']);
        $this->makeMember(['name' => 'Someone Else']);

        $this->assertSame([$jane->id], $this->searchIds('Runner'));
        $this->assertSame([$jane->id], $this->searchIds('jane@'));
        $this->assertSame([$jane->id], $this->searchIds('5557777'));
        $this->assertSame([$numbered->id], $this->searchIds('00077'));
    }

    public function test_list_length_is_capped_at_100(): void
    {
        $this->actingAsAdmin();

        $this->getJson(self::BASE.'?length=500')->assertJsonPath('data.pagination.per_page', 100);
    }

    public function test_list_ignores_an_unknown_sort_column(): void
    {
        $this->actingAsAdmin();
        $first = $this->makeMember();
        $second = $this->makeMember();

        $response = $this->getJson(self::BASE.'?column=password&dir=asc');

        $response->assertOk();
        $this->assertSame([$second->id, $first->id], collect($response->json('data.list'))->pluck('id')->all());
    }

    public function test_list_sorts_by_an_allowed_column(): void
    {
        $this->actingAsAdmin();
        $this->makeMember(['name' => 'Zed']);
        $this->makeMember(['name' => 'Amy']);

        $this->getJson(self::BASE.'?column=name&dir=asc')->assertJsonPath('data.list.0.name', 'Amy');
    }

    public function test_list_pagination_shape(): void
    {
        $this->actingAsAdmin();
        User::factory()->count(3)->member()->pending()->create();

        $this->getJson(self::BASE.'?length=2&page=2')
            ->assertOk()
            ->assertJsonPath('data.pagination', [
                'total' => 3,
                'count' => 1,
                'per_page' => 2,
                'current_page' => 2,
                'total_pages' => 2,
            ]);
    }

    // ------------------------------------------------------------ show

    public function test_show_returns_the_member(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->getJson(self::BASE."/{$member->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $member->id)
            ->assertJsonPath('data.status', 'pending');
    }

    // ------------------------------------------------------------ approve

    public function test_approve_activates_a_pending_member_who_can_then_log_in(): void
    {
        $admin = $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->postJson(self::BASE."/{$member->id}/approve")
            ->assertOk()
            ->assertJsonPath('message', 'Member approved successfully')
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.membership_number', sprintf('GYM-%s-%05d', now()->year, $member->id));

        $member->refresh();
        $this->assertSame($admin->id, $member->approved_by);
        $this->assertNotNull($member->approved_at);

        $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'Password@123'])
            ->assertOk()
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_approve_a_rejected_member_clears_the_rejection(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->member()->rejected('Blurry photo.')->create();

        $this->postJson(self::BASE."/{$member->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.rejection_reason', null)
            ->assertJsonPath('data.rejected_at', null);

        $this->assertNull($member->fresh()->rejected_by);
    }

    public function test_approve_keeps_an_existing_membership_number(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->member()->rejected()->create(['membership_number' => 'GYM-2025-00001']);

        $this->postJson(self::BASE."/{$member->id}/approve")->assertJsonPath('data.membership_number', 'GYM-2025-00001');
    }

    public function test_approve_an_approved_member_is_a_conflict(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->member()->approved()->create();

        $this->assertApiError($this->postJson(self::BASE."/{$member->id}/approve"), 409, 'INVALID_MEMBER_TRANSITION');
    }

    // ------------------------------------------------------------ reject

    public function test_reject_requires_a_reason(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->postJson(self::BASE."/{$member->id}/reject")->assertStatus(422)->assertJsonValidationErrors(['reason']);
        $this->postJson(self::BASE."/{$member->id}/reject", ['reason' => 'no'])->assertJsonValidationErrors(['reason']);
    }

    public function test_reject_a_pending_member_blocks_login_with_the_reason(): void
    {
        $admin = $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->postJson(self::BASE."/{$member->id}/reject", ['reason' => 'ID document missing.'])
            ->assertOk()
            ->assertJsonPath('message', 'Member rejected successfully')
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'ID document missing.');

        $this->assertSame($admin->id, $member->fresh()->rejected_by);

        $response = $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'Password@123']);
        $this->assertApiError($response, 403, 'MEMBER_REJECTED');
        $response->assertJsonPath('errors.rejection_reason', 'ID document missing.');
    }

    public function test_reject_an_approved_member_is_a_conflict(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->member()->approved()->create();

        $this->assertApiError(
            $this->postJson(self::BASE."/{$member->id}/reject", ['reason' => 'Changed our mind.']),
            409,
            'INVALID_MEMBER_TRANSITION',
        );
    }

    // ------------------------------------------------------------ notifications

    public function test_approval_emails_the_member(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->postJson(self::BASE."/{$member->id}/approve")->assertOk();

        Notification::assertSentTo($member, MemberApprovedNotification::class, function (MemberApprovedNotification $n) use ($member): bool {
            $mail = $n->toMail($member->fresh());

            return str_contains($mail->subject, 'membership is approved')
                && str_contains(implode(' ', $mail->introLines), $member->fresh()->membership_number);
        });
    }

    public function test_rejection_emails_the_reason(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->postJson(self::BASE."/{$member->id}/reject", ['reason' => 'Photo ID unreadable.'])->assertOk();

        Notification::assertSentTo($member, MemberRejectedNotification::class, function (MemberRejectedNotification $n) use ($member): bool {
            return str_contains(implode(' ', $n->toMail($member->fresh())->introLines), 'Photo ID unreadable.');
        });
    }

    public function test_failed_transition_sends_nothing(): void
    {
        $this->actingAsAdmin();
        $approved = User::factory()->member()->approved()->create();

        $this->postJson(self::BASE."/{$approved->id}/approve")->assertStatus(409);
        $this->postJson(self::BASE."/{$approved->id}/reject", ['reason' => 'Some reason'])->assertStatus(409);

        Notification::assertNothingSent();
    }

    public function test_notifications_are_queued_after_commit(): void
    {
        $notification = new MemberApprovedNotification;

        $this->assertTrue($notification->afterCommit);
        $this->assertInstanceOf(ShouldQueue::class, $notification);
    }

    // ------------------------------------------------------------ deactivate / activate

    public function test_deactivate_revokes_existing_tokens(): void
    {
        $member = User::factory()->member()->approved()->create();
        $token = $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'Password@123'])
            ->json('data.token');

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk();

        $this->actingAsAdmin();
        $this->postJson(self::BASE."/{$member->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('message', 'Member deactivated successfully')
            ->assertJsonPath('data.is_active', false);

        $this->assertSame(0, $member->tokens()->where('revoked', false)->count());

        $this->app['auth']->forgetGuards();
        $this->assertApiError($this->withToken($token)->getJson('/api/v1/auth/me'), 401);

        $this->assertApiError(
            $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'Password@123']),
            403,
            'MEMBER_INACTIVE',
        );
    }

    public function test_activate_restores_login(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->member()->approved()->inactive()->create();

        $this->postJson(self::BASE."/{$member->id}/activate")
            ->assertOk()
            ->assertJsonPath('message', 'Member activated successfully')
            ->assertJsonPath('data.is_active', true);

        $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'Password@123'])->assertOk();
    }

    public function test_invalid_activation_transitions_are_conflicts(): void
    {
        $this->actingAsAdmin();
        $active = User::factory()->member()->approved()->create();
        $pending = $this->makeMember();

        $this->assertApiError($this->postJson(self::BASE."/{$active->id}/activate"), 409, 'INVALID_MEMBER_TRANSITION');
        $this->assertApiError($this->postJson(self::BASE."/{$pending->id}/activate"), 409, 'INVALID_MEMBER_TRANSITION');
        $this->assertApiError($this->postJson(self::BASE."/{$pending->id}/deactivate"), 409, 'INVALID_MEMBER_TRANSITION');
    }

    public function test_deactivating_outside_the_service_still_revokes_tokens(): void
    {
        $member = User::factory()->member()->approved()->create();
        $member->createToken('member-app');

        $member->update(['is_active' => false]);

        $this->assertSame(0, $member->tokens()->where('revoked', false)->count());
    }

    // ------------------------------------------------------------ update / delete

    public function test_update_changes_profile_fields_only(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->putJson(self::BASE."/{$member->id}", [
            'name' => 'New Name',
            'phone' => '+44 20 7946 0958',
            'status' => 'approved',
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Member updated successfully')
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.phone', '+442079460958')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.is_active', false);
    }

    public function test_update_keeps_the_members_own_email(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();

        $this->putJson(self::BASE."/{$member->id}", ['email' => $member->email])->assertOk();
    }

    public function test_update_to_another_users_email_is_rejected(): void
    {
        $this->actingAsAdmin();
        $member = $this->makeMember();
        $other = $this->makeMember();

        $this->putJson(self::BASE."/{$member->id}", ['email' => $other->email])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_delete_soft_deletes_and_revokes_tokens(): void
    {
        $this->actingAsAdmin();
        $member = User::factory()->member()->approved()->create();
        $member->createToken('member-app');

        $this->deleteJson(self::BASE."/{$member->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Member deleted successfully')
            ->assertJsonPath('data', null);

        $this->assertSoftDeleted('users', ['id' => $member->id]);
        $this->assertSame(0, DB::table('oauth_access_tokens')->where('user_id', $member->id)->where('revoked', false)->count());
        $this->assertApiError($this->getJson(self::BASE."/{$member->id}"), 404);
    }

    public function test_targeting_an_admin_returns_404(): void
    {
        $this->actingAsAdmin();
        $otherAdmin = User::factory()->admin()->create();

        $this->assertApiError($this->getJson(self::BASE."/{$otherAdmin->id}"), 404);
        $this->assertApiError($this->postJson(self::BASE."/{$otherAdmin->id}/deactivate"), 404);
        $this->assertApiError($this->deleteJson(self::BASE."/{$otherAdmin->id}"), 404);
    }

    public function test_unknown_member_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->getJson(self::BASE.'/999999')
            ->assertStatus(404)
            ->assertJsonPath('message', 'Member not found');
    }

    // ------------------------------------------------------------ helpers

    /** @return list<array{string, string, array}> */
    private function routes(int $id): array
    {
        return [
            ['GET', self::BASE, []],
            ['GET', self::BASE."/{$id}", []],
            ['PUT', self::BASE."/{$id}", ['name' => 'X Y']],
            ['DELETE', self::BASE."/{$id}", []],
            ['POST', self::BASE."/{$id}/approve", []],
            ['POST', self::BASE."/{$id}/reject", ['reason' => 'Some reason']],
            ['POST', self::BASE."/{$id}/activate", []],
            ['POST', self::BASE."/{$id}/deactivate", []],
        ];
    }

    /** @return list<int> */
    private function searchIds(string $search): array
    {
        return collect($this->getJson(self::BASE.'?search='.urlencode($search))->json('data.list'))->pluck('id')->all();
    }
}
