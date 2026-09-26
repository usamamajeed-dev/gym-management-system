<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EventType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/** Default event types. Safe to run repeatedly. */
class EventTypeSeeder extends Seeder
{
    private const TYPES = [
        ['name' => 'Class', 'color' => '#2196F3', 'description' => 'Instructor-led group classes.'],
        ['name' => 'Workshop', 'color' => '#9C27B0', 'description' => 'Hands-on sessions on technique, nutrition and recovery.'],
        ['name' => 'Competition', 'color' => '#F44336', 'description' => 'In-house challenges and competitions.'],
        ['name' => 'Social', 'color' => '#4CAF50', 'description' => 'Community and social gatherings.'],
    ];

    public function run(): void
    {
        foreach (self::TYPES as $type) {
            EventType::firstOrCreate(
                ['slug' => Str::slug($type['name'])],
                [...$type, 'is_active' => true],
            );
        }
    }
}
