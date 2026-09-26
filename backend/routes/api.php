<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Member\AuthController;
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
    /** Auth routes */
    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

        Route::middleware(['auth:api', 'role:member,api', 'member.active'])->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });
});
