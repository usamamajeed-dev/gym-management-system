<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Event;
use App\Repositories\Base\BaseRepository;
use App\Support\DateFormat;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Throwable;

class EventRepository extends BaseRepository
{
    private const SORTABLE = ['id', 'title', 'starts_at', 'created_at'];

    public function model(): string
    {
        return Event::class;
    }

    /**
     * Admin list. Filters: search (title/location), event_type_id, is_published,
     * from / to (dates in gym time, compared to starts_at). Default sort: starts_at desc.
     */
    public function index(Request $request): LengthAwarePaginator
    {
        $query = $this->query()->with(['eventType', 'createdBy']);

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $like = $this->likeValue($search);
            $query->where(fn (Builder $q) => $q->where('title', 'like', $like)->orWhere('location', 'like', $like));
        }

        if (filter_var($request->input('event_type_id'), FILTER_VALIDATE_INT) !== false) {
            $query->where('event_type_id', (int) $request->input('event_type_id'));
        }

        $isPublished = filter_var($request->input('is_published'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($request->filled('is_published') && $isPublished !== null) {
            $query->where('is_published', $isPublished);
        }

        if ($from = $this->localDate($request->input('from'))) {
            $query->where('starts_at', '>=', $from->startOfDay()->utc());
        }

        if ($to = $this->localDate($request->input('to'))) {
            $query->where('starts_at', '<=', $to->endOfDay()->utc());
        }

        $this->applySorting($query, $request, self::SORTABLE, 'starts_at');

        return $query->paginate($this->pageSize($request));
    }

    /** Published events overlapping the month of $month (gym time), earliest first. */
    public function forMonth(CarbonInterface $month): Collection
    {
        return $this->query()
            ->with('eventType')
            ->published()
            ->overlappingMonth($month)
            ->orderBy('starts_at')
            ->get();
    }

    /** Number of published events overlapping the month of $month (gym time). */
    public function countForMonth(CarbonInterface $month): int
    {
        return $this->query()->published()->overlappingMonth($month)->count();
    }

    /**
     * Dashboard counts in one query: published events this month (gym time),
     * published events not started yet, and drafts.
     *
     * @return array{this_month: int, upcoming: int, drafts: int}
     */
    public function dashboardCounts(CarbonInterface $month): array
    {
        $local = $month->copy()->setTimezone(DateFormat::timezone());
        $start = $local->copy()->startOfMonth()->utc()->format('Y-m-d H:i:s');
        $end = $local->copy()->endOfMonth()->utc()->format('Y-m-d H:i:s');

        $row = $this->query()->toBase()->selectRaw(
            'SUM(CASE WHEN is_published = 1 AND starts_at <= ? AND COALESCE(ends_at, starts_at) >= ? THEN 1 ELSE 0 END) AS this_month, '
            .'SUM(CASE WHEN is_published = 1 AND starts_at >= ? THEN 1 ELSE 0 END) AS upcoming, '
            .'SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) AS drafts',
            [$end, $start, now()->utc()->format('Y-m-d H:i:s')],
        )->first();

        return [
            'this_month' => (int) ($row->this_month ?? 0),
            'upcoming' => (int) ($row->upcoming ?? 0),
            'drafts' => (int) ($row->drafts ?? 0),
        ];
    }

    /** Published events that haven't started yet, earliest first. */
    public function upcoming(int $limit): Collection
    {
        return $this->query()
            ->with('eventType')
            ->published()
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit($limit)
            ->get();
    }

    /** Parse a Y-m-d filter value as a date in the gym's timezone; ignore anything invalid. */
    private function localDate(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return null;
        }

        try {
            return CarbonImmutable::createFromFormat('!Y-m-d', $value, DateFormat::timezone()) ?: null;
        } catch (Throwable) {
            return null;
        }
    }
}
