<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolePermissionSeederTest extends TestCase
{
    private const ADMIN_PERMISSIONS = [
        'dashboard.view',
        'members.view',
        'members.manage',
        'members.approve',
        'timings.manage',
        'events.manage',
        'contents.manage',
    ];

    // ------------------------------------------------------------ roles & permissions

    public function test_admin_and_member_roles_exist_on_the_api_guard(): void
    {
        $roles = Role::query()->pluck('guard_name', 'name');

        $this->assertSame('api', $roles['admin'] ?? null);
        $this->assertSame('api', $roles['member'] ?? null);
    }

    public function test_every_permission_uses_the_api_guard(): void
    {
        $this->assertSame(8, Permission::query()->count());
        $this->assertSame(['api'], Permission::query()->distinct()->pluck('guard_name')->all());
    }

    public function test_admin_has_all_admin_permissions(): void
    {
        $permissions = Role::findByName('admin', 'api')->permissions->pluck('name')->all();

        $this->assertEqualsCanonicalizing(self::ADMIN_PERMISSIONS, $permissions);
    }

    public function test_member_only_has_gym_view(): void
    {
        $permissions = Role::findByName('member', 'api')->permissions->pluck('name')->all();

        $this->assertSame(['gym.view'], $permissions);
    }

    // ------------------------------------------------------------ test helpers

    public function test_acting_as_admin_can_view_members(): void
    {
        $admin = $this->actingAsAdmin();

        $this->assertTrue($admin->can('members.view'));
        $this->assertTrue($admin->isAdmin());
    }

    public function test_acting_as_member_cannot_view_members(): void
    {
        $member = $this->actingAsMember();

        $this->assertFalse($member->can('members.view'));
        $this->assertTrue($member->can('gym.view'));
        $this->assertTrue($member->canLogInAsMember());
    }

    public function test_make_member_is_pending_by_default(): void
    {
        $member = $this->makeMember();

        $this->assertTrue($member->isMember());
        $this->assertTrue($member->isPending());
        $this->assertFalse($member->canLogInAsMember());
    }
}
