<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Models\Base\BaseModel;
use Database\Factories\ContentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * A news item or policy. Lifecycle: draft → published → archived (and back to published).
 * Members see published items as "current" and archived items as "older".
 */
class Content extends BaseModel
{
    /** @use HasFactory<ContentFactory> */
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'slug',
        'excerpt',
        'body',
        'image_path',
        'status',
        'published_at',
        'archived_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => ContentType::class,
            'status' => ContentStatus::class,
            'published_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function label(): string
    {
        return $this->type === ContentType::POLICY ? 'Policy' : 'News';
    }

    public function scopeOfType(Builder $query, ContentType $type): Builder
    {
        return $query->where('type', $type->value);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::PUBLISHED->value);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::ARCHIVED->value);
    }

    /** Published or archived; drafts are never visible to members. */
    public function scopeVisibleToMembers(Builder $query): Builder
    {
        return $query->whereIn('status', [ContentStatus::PUBLISHED->value, ContentStatus::ARCHIVED->value]);
    }
}
