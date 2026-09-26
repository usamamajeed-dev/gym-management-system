<?php

declare(strict_types=1);

namespace App\Http\Resources\Member;

use App\Http\Resources\Base\BaseResourceCollection;

class MemberResourceCollection extends BaseResourceCollection
{
    protected function itemResource(): string
    {
        return MemberResource::class;
    }
}
