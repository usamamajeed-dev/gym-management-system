<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Models\Content;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Default: a published news item.
 *
 * @extends Factory<Content>
 */
class ContentFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->sentence(5);

        return [
            'type' => ContentType::NEWS,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'excerpt' => fake()->sentence(12),
            'body' => '<p>'.fake()->paragraph().'</p>',
            'status' => ContentStatus::PUBLISHED,
            'published_at' => now()->subDay(),
            'archived_at' => null,
        ];
    }

    public function news(): static
    {
        return $this->state(fn (array $attributes) => ['type' => ContentType::NEWS]);
    }

    public function policy(): static
    {
        return $this->state(fn (array $attributes) => ['type' => ContentType::POLICY]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContentStatus::DRAFT,
            'published_at' => null,
            'archived_at' => null,
        ]);
    }

    public function published(?CarbonInterface $at = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContentStatus::PUBLISHED,
            'published_at' => $at ?? now()->subDay(),
            'archived_at' => null,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContentStatus::ARCHIVED,
            'published_at' => $attributes['published_at'] ?? now()->subMonths(2),
            'archived_at' => now(),
        ]);
    }
}
