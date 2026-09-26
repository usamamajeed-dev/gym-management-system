<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\EventType;
use App\Repositories\Base\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class EventTypeRepository extends BaseRepository
{
    private const SORTABLE = ['id', 'name', 'created_at'];

    public function model(): string
    {
        return EventType::class;
    }

    /** Admin list with events_count; search on name. */
    public function index(Request $request): LengthAwarePaginator
    {
        $query = $this->query()->withCount('events');

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where('name', 'like', $this->likeValue($search));
        }

        $this->applySorting($query, $request, self::SORTABLE);

        return $query->paginate($this->pageSize($request));
    }

    /** Active types for dropdowns, ordered by name. */
    public function options(): Collection
    {
        return $this->query()->where('is_active', true)->orderBy('name')->get();
    }
}
