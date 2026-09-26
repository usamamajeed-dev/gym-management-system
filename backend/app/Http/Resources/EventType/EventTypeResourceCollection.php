<?php

declare(strict_types=1);

namespace App\Http\Resources\EventType;

use App\Http\Resources\Base\BaseResourceCollection;

class EventTypeResourceCollection extends BaseResourceCollection
{
    protected function itemResource(): string
    {
        return EventTypeResource::class;
    }
}
