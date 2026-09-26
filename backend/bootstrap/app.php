<?php

declare(strict_types=1);

use App\Exceptions\ApiException;
use App\Exceptions\ApiExceptionHandler;
use App\Http\Middleware\EnsureMemberIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
        then: function (): void {
            Route::prefix('api/admin')
                ->middleware('api')
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'member.active' => EnsureMemberIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport([ApiException::class]);

        $exceptions->render(function (Throwable $e, Request $request) {
            if (ApiExceptionHandler::shouldRender($request)) {
                return ApiExceptionHandler::render($e, $request);
            }
        });
    })->create();
