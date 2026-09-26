<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Gym settings
    |--------------------------------------------------------------------------
    |
    | "timezone" is the gym's local timezone. Datetimes are stored in UTC and
    | converted to this zone for display; gym opening hours are wall-clock
    | times in this zone. "list_max_length" caps the ?length of admin lists.
    |
    */

    'name' => env('GYM_NAME', 'My Gym'),

    'timezone' => env('GYM_TIMEZONE', 'UTC'),

    'list_max_length' => 100,

    /*
    |--------------------------------------------------------------------------
    | Seeded admin account
    |--------------------------------------------------------------------------
    */

    'admin' => [
        'name' => env('ADMIN_NAME', 'Gym Admin'),
        'email' => env('ADMIN_EMAIL', 'admin@gym.test'),
        'password' => env('ADMIN_PASSWORD', 'Admin@12345'),
    ],

];
