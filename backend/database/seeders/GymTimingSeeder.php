<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GymTiming;
use Illuminate\Database\Seeder;

/** Default week: Mon–Fri 06:00–22:00, Sat 08:00–20:00, Sun closed. Safe to run repeatedly. */
class GymTimingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (range(0, 6) as $day) {
            GymTiming::updateOrCreate(['day_of_week' => $day], match ($day) {
                0 => ['is_closed' => true, 'opens_at' => null, 'closes_at' => null],
                6 => ['is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '20:00'],
                default => ['is_closed' => false, 'opens_at' => '06:00', 'closes_at' => '22:00'],
            });
        }
    }
}
