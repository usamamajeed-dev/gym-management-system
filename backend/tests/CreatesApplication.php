<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Artisan;

/**
 * Boots the app and, once per test run (per PHP process), rebuilds the
 * disposable test database: fresh schema, seeded roles/permissions and
 * reference data, Passport keys and a personal access client.
 */
trait CreatesApplication
{
    public function createApplication(): Application
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        if (! getenv('APPLICATION_CREATED')) {
            $this->prepareTestDatabase();
            putenv('APPLICATION_CREATED=true');
        }

        return $app;
    }

    private function prepareTestDatabase(): void
    {
        Artisan::call('config:clear');
        Artisan::call('migrate:fresh', ['--force' => true]);
        Artisan::call('db:seed', ['--class' => 'RolePermissionSeeder', '--force' => true]);
        Artisan::call('db:seed', ['--class' => 'GymTimingSeeder', '--force' => true]);

        // Reuse the existing signing keys so local dev tokens stay valid; create them only if missing.
        if (! file_exists(storage_path('oauth-private.key'))) {
            Artisan::call('passport:keys');
        }

        Artisan::call('passport:client', [
            '--personal' => true,
            '--name' => 'Test Personal Access Client',
            '--no-interaction' => true,
        ]);
    }
}
