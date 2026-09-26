<?php

declare(strict_types=1);

namespace Tests\Feature\Routes;

use Illuminate\Routing\Route;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Route as RouteFacade;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Guards against a new route being added without its role, permission or member checks. */
class RouteMiddlewareTest extends TestCase
{
    public function test_every_admin_route_outside_auth_requires_the_admin_role_and_a_permission(): void
    {
        $routes = $this->routes('api/admin/*')->reject(fn (Route $route) => Str::startsWith($route->uri(), 'api/admin/auth/'));

        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $middleware = $route->gatherMiddleware();

            $this->assertContains('auth:api', $middleware, $this->label($route));
            $this->assertContains('role:admin,api', $middleware, $this->label($route));
            $this->assertNotEmpty(
                array_filter($middleware, fn (string $m) => preg_match('/^permission:[a-z.]+,api$/', $m) === 1),
                $this->label($route).' has no permission middleware',
            );
        }
    }

    public function test_admin_auth_routes(): void
    {
        foreach (['api/admin/auth/logout', 'api/admin/auth/me'] as $uri) {
            $middleware = $this->route($uri)->gatherMiddleware();

            $this->assertContains('auth:api', $middleware, $uri);
            $this->assertContains('role:admin,api', $middleware, $uri);
        }

        $this->assertContains('throttle:login', $this->route('api/admin/auth/login')->gatherMiddleware());
    }

    public function test_every_member_route_except_register_and_login_requires_an_active_member(): void
    {
        $public = ['api/v1/auth/register', 'api/v1/auth/login'];
        $routes = $this->routes('api/v1/*')->reject(fn (Route $route) => in_array($route->uri(), $public, true));

        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $middleware = $route->gatherMiddleware();

            $this->assertContains('auth:api', $middleware, $this->label($route));
            $this->assertContains('role:member,api', $middleware, $this->label($route));
            $this->assertContains('member.active', $middleware, $this->label($route));
        }
    }

    public function test_public_auth_routes_are_rate_limited(): void
    {
        $this->assertContains('throttle:register', $this->route('api/v1/auth/register')->gatherMiddleware());
        $this->assertContains('throttle:login', $this->route('api/v1/auth/login')->gatherMiddleware());
    }

    /** @return Collection<int, Route> */
    private function routes(string $pattern): Collection
    {
        return collect(RouteFacade::getRoutes()->getRoutes())->filter(fn (Route $route) => Str::is($pattern, $route->uri()));
    }

    private function route(string $uri): Route
    {
        return $this->routes($uri)->firstOrFail();
    }

    private function label(Route $route): string
    {
        return implode('|', $route->methods()).' '.$route->uri();
    }
}
