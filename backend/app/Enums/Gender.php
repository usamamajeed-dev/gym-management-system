<?php

declare(strict_types=1);

namespace App\Enums;

use App\Enums\Concerns\EnumValues;

enum Gender: string
{
    use EnumValues;

    case MALE = 'male';
    case FEMALE = 'female';
    case OTHER = 'other';
}
