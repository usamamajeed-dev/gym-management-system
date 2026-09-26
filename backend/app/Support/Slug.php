<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

final class Slug
{
    /**
     * A slug for $source that is unique in $query's table: "yoga", "yoga-2", "yoga-3" …
     * Pass $ignoreId when renaming an existing row so it doesn't clash with itself.
     */
    public static function unique(Builder $query, string $source, ?int $ignoreId = null, string $column = 'slug'): string
    {
        $base = Str::slug($source) ?: 'item';
        $slug = $base;
        $suffix = 2;

        while ((clone $query)
            ->where($column, $slug)
            ->when($ignoreId !== null, fn (Builder $q) => $q->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
