<?php

declare(strict_types=1);

namespace App\Http\Resources\Base;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * The one pagination shape for every paginated list:
 * { list: [...], pagination: { total, count, per_page, current_page, total_pages } }.
 *
 * Wrap a LengthAwarePaginator and pass the result to successResponse().
 * A concrete collection only names its item resource:
 *
 *   protected function itemResource(): string
 *   {
 *       return EventResource::class;
 *   }
 */
abstract class BaseResourceCollection extends ResourceCollection
{
    /** The JsonResource class used for each item. */
    abstract protected function itemResource(): string;

    /**
     * Wrap items in itemResource(). Without this, Laravel guesses the item class
     * from the collection's name (ContentResourceCollection → ContentResource),
     * which is wrong when a list uses a slimmer resource such as ContentListResource.
     */
    protected function collects(): string
    {
        return $this->itemResource();
    }

    public function toArray(Request $request): array
    {
        return [
            'list' => $this->collection,
            'pagination' => [
                'total' => $this->total(),
                'count' => $this->count(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
                'total_pages' => $this->lastPage(),
            ],
        ];
    }
}
