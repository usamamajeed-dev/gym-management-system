<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Role permissions (guard: api)
    |--------------------------------------------------------------------------
    |
    | Source of truth for RolePermissionSeeder. Route groups enforce these
    | with the "permission:<name>,api" middleware.
    |
    */

    'permissions' => [
        'admin' => [
            'dashboard.view',
            'members.view',
            'members.manage',
            'members.approve',
            'timings.manage',
            'events.manage',
            'contents.manage',
        ],
        'member' => [
            'gym.view',
        ],
    ],

];
