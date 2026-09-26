<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Member app routes — prefix: api/v1
|--------------------------------------------------------------------------
|
| Protected member routes use:
| auth:api, role:member,api, member.active, permission:gym.view,api
|
*/

Route::prefix('v1')->group(function (): void {
    //
});
