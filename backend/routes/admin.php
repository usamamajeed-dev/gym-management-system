<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin portal routes — prefix: api/admin
|--------------------------------------------------------------------------
|
| Protected admin routes use auth:api + role:admin,api, and each route
| group adds its own permission:<name>,api.
|
*/

Route::middleware(['auth:api', 'role:admin,api'])->group(function (): void {
    //
});
