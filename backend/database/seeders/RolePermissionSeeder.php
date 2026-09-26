<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Creates the roles and permissions from config('constants.permissions'),
 * all on the "api" guard. Safe to run repeatedly.
 */
class RolePermissionSeeder extends Seeder
{
    private const GUARD = 'api';

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionsByRole = config('constants.permissions');

        $this->createPermissions($permissionsByRole);
        $this->createRolesAndAssignPermissions($permissionsByRole);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /** @param array<string, list<string>> $permissionsByRole */
    private function createPermissions(array $permissionsByRole): void
    {
        $names = array_unique(array_merge(...array_values($permissionsByRole)));

        foreach ($names as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => self::GUARD]);
        }
    }

    /** @param array<string, list<string>> $permissionsByRole */
    private function createRolesAndAssignPermissions(array $permissionsByRole): void
    {
        foreach ($permissionsByRole as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => self::GUARD]);
            $role->syncPermissions($permissions);
        }
    }
}
