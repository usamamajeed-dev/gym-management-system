<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled tasks — run with "php artisan schedule:work" (dev) or a cron
| entry calling "php artisan schedule:run" every minute (production).
|--------------------------------------------------------------------------
*/

Schedule::command('contents:archive-old-news')
    ->dailyAt('00:10')
    ->timezone(config('gym.timezone'));
