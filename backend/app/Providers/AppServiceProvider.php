<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Tokens are issued with createToken() only; the OAuth browser/grant routes are not used.
        Passport::ignoreRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passport::tokensExpireIn(now()->addDays(30));
        Passport::refreshTokensExpireIn(now()->addDays(60));
        Passport::personalAccessTokensExpireIn(now()->addDays(30));

        $this->configureRateLimiting();

        // Surface N+1 queries during development and tests.
        Model::preventLazyLoading(! $this->app->isProduction());
    }

    /**
     * Named limiters for the public auth endpoints. They are switched off only
     * inside the limiter definition for the test suite, so routes keep their middleware.
     */
    private function configureRateLimiting(): void
    {
        // Registration is keyed by IP alone: keying by email would let one client
        // bypass the limit by trying a new address each time.
        RateLimiter::for('register', fn (Request $request): Limit => $this->app->environment('testing')
            ? Limit::none()
            : Limit::perMinute(5)->by('register|'.$request->ip()));

        // Login is keyed by portal + IP + email, so member and admin logins count separately.
        RateLimiter::for('login', fn (Request $request): Limit => $this->app->environment('testing')
            ? Limit::none()
            : Limit::perMinute(10)->by(implode('|', [
                'login',
                $request->is('api/admin/*') ? 'admin' : 'member',
                $request->ip(),
                strtolower(trim((string) $request->input('email'))),
            ])));
    }
}
