<?php

declare(strict_types=1);

namespace App\Enums\Concerns;

/**
 * For backed enums: MemberStatus::values() → ['pending', 'approved', 'rejected'].
 */
trait EnumValues
{
    /** @return list<string|int> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
