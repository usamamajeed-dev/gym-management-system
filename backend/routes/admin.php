<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Admin\AuthController as AdminAuthController;
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

/** Auth routes */
Route::prefix('auth')->group(function (): void {
    Route::post('login', [AdminAuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:api', 'role:admin,api'])->group(function (): void {
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('me', [AdminAuthController::class, 'me']);
    });
});

Route::middleware(['auth:api', 'role:admin,api'])->group(function (): void {
    //
});
