<?php

declare(strict_types=1);

use App\Http\Controllers\Api\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Api\Admin\ContentController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\EventController;
use App\Http\Controllers\Api\Admin\EventTypeController;
use App\Http\Controllers\Api\Admin\GymTimingController;
use App\Http\Controllers\Api\Admin\MemberController;
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
    /** Dashboard routes */
    Route::get('dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard.view,api');

    /** Member routes */
    Route::prefix('members')->group(function (): void {
        Route::middleware('permission:members.view,api')->group(function (): void {
            Route::get('', [MemberController::class, 'index']);
            Route::get('{member}', [MemberController::class, 'show'])->whereNumber('member');
        });
        Route::middleware('permission:members.manage,api')->group(function (): void {
            Route::put('{member}', [MemberController::class, 'update'])->whereNumber('member');
            Route::delete('{member}', [MemberController::class, 'destroy'])->whereNumber('member');
        });
        Route::middleware('permission:members.approve,api')->group(function (): void {
            Route::post('{member}/approve', [MemberController::class, 'approve'])->whereNumber('member');
            Route::post('{member}/reject', [MemberController::class, 'reject'])->whereNumber('member');
            Route::post('{member}/activate', [MemberController::class, 'activate'])->whereNumber('member');
            Route::post('{member}/deactivate', [MemberController::class, 'deactivate'])->whereNumber('member');
        });
    });

    /** Gym timing routes */
    Route::prefix('gym-timings')->middleware('permission:timings.manage,api')->group(function (): void {
        Route::get('', [GymTimingController::class, 'index']);
        Route::put('', [GymTimingController::class, 'update']);
    });

    /** Event type routes */
    Route::prefix('event-types')->middleware('permission:events.manage,api')->group(function (): void {
        Route::get('options', [EventTypeController::class, 'options']);
        Route::get('', [EventTypeController::class, 'index']);
        Route::post('', [EventTypeController::class, 'store']);
        Route::get('{eventType}', [EventTypeController::class, 'show'])->whereNumber('eventType');
        Route::put('{eventType}', [EventTypeController::class, 'update'])->whereNumber('eventType');
        Route::delete('{eventType}', [EventTypeController::class, 'destroy'])->whereNumber('eventType');
    });

    /** Event routes */
    Route::prefix('events')->middleware('permission:events.manage,api')->group(function (): void {
        Route::get('', [EventController::class, 'index']);
        Route::post('', [EventController::class, 'store']);
        Route::get('{event}', [EventController::class, 'show'])->whereNumber('event');
        Route::put('{event}', [EventController::class, 'update'])->whereNumber('event');
        Route::delete('{event}', [EventController::class, 'destroy'])->whereNumber('event');
    });

    /** Content (news & policies) routes */
    Route::prefix('contents')->middleware('permission:contents.manage,api')->group(function (): void {
        Route::get('', [ContentController::class, 'index']);
        Route::post('', [ContentController::class, 'store']);
        Route::get('{content}', [ContentController::class, 'show'])->whereNumber('content');
        Route::put('{content}', [ContentController::class, 'update'])->whereNumber('content');
        Route::delete('{content}', [ContentController::class, 'destroy'])->whereNumber('content');
        Route::post('{content}/publish', [ContentController::class, 'publish'])->whereNumber('content');
        Route::post('{content}/archive', [ContentController::class, 'archive'])->whereNumber('content');
    });
});
