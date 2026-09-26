<?php

declare(strict_types=1);

namespace App\Enums;

use App\Enums\Concerns\EnumValues;

/** Content lifecycle: draft → published → archived. */
enum ContentStatus: string
{
    use EnumValues;

    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
}
