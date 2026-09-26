<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /** Safety net: whenever a user is deactivated, however it happens, their tokens are revoked. */
    public function updated(User $user): void
    {
        if ($user->wasChanged('is_active') && ! $user->is_active) {
            $user->tokens()->update(['revoked' => true]);
        }
    }
}
