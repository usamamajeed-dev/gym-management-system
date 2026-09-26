<?php

declare(strict_types=1);

namespace App\Enums;

use App\Enums\Concerns\EnumValues;

/** Gym content kinds stored in the contents table. */
enum ContentType: string
{
    use EnumValues;

    case NEWS = 'news';
    case POLICY = 'policy';
}
