<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Base\BaseModel;
use Database\Factories\EventTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A kind of gym event (Class, Workshop, Competition…), with a badge colour. */
class EventType extends BaseModel
{
    /** @use HasFactory<EventTypeFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'description',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
