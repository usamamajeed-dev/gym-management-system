<?php

declare(strict_types=1);

namespace App\Http\Resources\Content;

use App\Http\Resources\Base\BaseResourceCollection;

/** Lists use the body-less ContentListResource. */
class ContentResourceCollection extends BaseResourceCollection
{
    protected function itemResource(): string
    {
        return ContentListResource::class;
    }
}
