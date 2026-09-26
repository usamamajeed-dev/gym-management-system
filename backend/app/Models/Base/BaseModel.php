<?php

declare(strict_types=1);

namespace App\Models\Base;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Base for every domain model.
 *
 * Fills created_by / updated_by with the authenticated user's id, but only for
 * models that list those columns in $fillable. A child model that defines its
 * own booted() must call parent::booted().
 */
abstract class BaseModel extends Model
{
    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            $userId = Auth::id();

            if ($userId === null) {
                return;
            }

            if ($model->isFillable('created_by') && $model->getAttribute('created_by') === null) {
                $model->setAttribute('created_by', $userId);
            }

            if ($model->isFillable('updated_by') && $model->getAttribute('updated_by') === null) {
                $model->setAttribute('updated_by', $userId);
            }
        });

        static::updating(function (self $model): void {
            $userId = Auth::id();

            if ($userId !== null && $model->isFillable('updated_by')) {
                $model->setAttribute('updated_by', $userId);
            }
        });
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }
}
