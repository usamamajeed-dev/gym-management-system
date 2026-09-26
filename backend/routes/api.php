<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Member\AuthController;
use App\Http\Controllers\Api\Member\ContentController;
use App\Http\Controllers\Api\Member\DashboardController;
use App\Http\Controllers\Api\Member\EventController;
use App\Http\Controllers\Api\Member\GymTimingController;
use App\Http\Controllers\Api\Member\ProfileController;
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

    Route::middleware(['auth:api', 'role:member,api', 'member.active', 'permission:gym.view,api'])->group(function (): void {
        /** Member dashboard */
        Route::get('dashboard', [DashboardController::class, 'index']);

        /** Gym timing routes */
        Route::get('gym-timings', [GymTimingController::class, 'index']);

        /** Event routes */
        Route::prefix('events')->group(function (): void {
            Route::get('', [EventController::class, 'index']);
            Route::get('{event}', [EventController::class, 'show'])->whereNumber('event');
        });

        /** Content routes */
        Route::prefix('contents')->group(function (): void {
            Route::get('', [ContentController::class, 'index']);
            Route::get('{content}', [ContentController::class, 'show'])->whereNumber('content');
        });

        /** Profile routes */
        Route::get('profile', [ProfileController::class, 'show']);
    });
});
