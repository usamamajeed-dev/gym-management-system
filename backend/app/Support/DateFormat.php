<?php

declare(strict_types=1);

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Output formats for API resources. Datetimes are stored in UTC and returned
 * as ISO-8601 with offset in the gym's timezone (config('gym.timezone')).
 */
final class DateFormat
{
    /** e.g. 2026-10-01T18:00:00+05:00, or null. */
    public static function iso(?CarbonInterface $value): ?string
    {
        return $value?->copy()->setTimezone(self::timezone())->toIso8601String();
    }

    /** Calendar date without time, e.g. 1990-05-17, or null. */
    public static function date(?CarbonInterface $value): ?string
    {
        return $value?->format('Y-m-d');
    }

    public static function timezone(): string
    {
        return (string) config('gym.timezone', 'UTC');
    }
}
