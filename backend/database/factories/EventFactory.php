<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventType;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        $startsAt = now()->addDays(fake()->numberBetween(1, 20))->setTime(18, 0);

        return [
            'event_type_id' => EventType::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'location' => 'Main Hall',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addHour(),
            'capacity' => 20,
            'is_published' => true,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => ['is_published' => true]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['is_published' => false]);
    }

    /** Starts on the 10th of $month at 18:00 UTC and lasts an hour. */
    public function inMonth(CarbonInterface $month): static
    {
        $startsAt = $month->copy()->startOfMonth()->addDays(9)->setTime(18, 0);

        return $this->state(fn (array $attributes) => [
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addHour(),
        ]);
    }
}
