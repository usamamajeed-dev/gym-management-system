<?php

declare(strict_types=1);

namespace App\Enums;

use App\Enums\Concerns\EnumValues;

/** Machine-readable error_code values returned to API clients. */
enum ErrorCode: string
{
    use EnumValues;

    case INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
    case MEMBER_PENDING = 'MEMBER_PENDING';
    case MEMBER_REJECTED = 'MEMBER_REJECTED';
    case MEMBER_INACTIVE = 'MEMBER_INACTIVE';
    case INVALID_MEMBER_TRANSITION = 'INVALID_MEMBER_TRANSITION';
    case EVENT_TYPE_IN_USE = 'EVENT_TYPE_IN_USE';
    case INVALID_CONTENT_TRANSITION = 'INVALID_CONTENT_TRANSITION';
}
