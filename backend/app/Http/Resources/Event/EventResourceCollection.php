<?php

declare(strict_types=1);

namespace App\Http\Resources\Event;

use App\Http\Resources\Base\BaseResourceCollection;

class EventResourceCollection extends BaseResourceCollection
{
    protected function itemResource(): string
    {
        return EventResource::class;
    }
}
