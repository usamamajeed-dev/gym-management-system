<?php

declare(strict_types=1);

namespace App\Enums;

use App\Enums\Concerns\EnumValues;

/** Where a member is in the registration/approval process. */
enum MemberStatus: string
{
    use EnumValues;

    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
}
