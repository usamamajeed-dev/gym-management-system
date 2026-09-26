<?php

declare(strict_types=1);

namespace App\Enums;

use App\Enums\Concerns\EnumValues;

/** Spatie role names (guard: api). */
enum RoleName: string
{
    use EnumValues;

    case ADMIN = 'admin';
    case MEMBER = 'member';
}
