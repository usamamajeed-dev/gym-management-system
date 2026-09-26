<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Base\BaseModel;
use App\Support\DateFormat;
use Carbon\CarbonInterface;
use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A gym event. starts_at / ends_at are stored in UTC; members only see published events. */
class Event extends BaseModel
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;

    protected $fillable = [
        'event_type_id',
        'title',
        'description',
        'location',
        'image_path',
        'starts_at',
        'ends_at',
        'capacity',
        'is_published',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'capacity' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /**
     * Events that overlap the calendar month containing $month, in the gym's timezone:
     * starts_at <= month end AND COALESCE(ends_at, starts_at) >= month start.
     */
    public function scopeOverlappingMonth(Builder $query, CarbonInterface $month): Builder
    {
        $local = $month->copy()->setTimezone(DateFormat::timezone());
        $start = $local->copy()->startOfMonth()->utc();
        $end = $local->copy()->endOfMonth()->utc();

        return $query
            ->where('starts_at', '<=', $end)
            ->whereRaw('COALESCE(ends_at, starts_at) >= ?', [$start->format('Y-m-d H:i:s')]);
    }
}
