<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Models\Content;
use App\Repositories\Base\BaseRepository;
use DateTimeInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;

class ContentRepository extends BaseRepository
{
    private const SORTABLE = ['id', 'title', 'published_at', 'created_at'];

    /** Members page through current/older lists 10 at a time. */
    private const MEMBER_PAGE_SIZE = 10;

    public function model(): string
    {
        return Content::class;
    }

    /** Admin list. Filters: type, status, search (title/excerpt). Default sort: id desc. */
    public function index(Request $request): LengthAwarePaginator
    {
        $query = $this->query();

        $type = ContentType::tryFrom((string) $request->input('type'));
        if ($type !== null) {
            $query->ofType($type);
        }

        $status = ContentStatus::tryFrom((string) $request->input('status'));
        if ($status !== null) {
            $query->where('status', $status->value);
        }

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $like = $this->likeValue($search);
            $query->where(fn (Builder $q) => $q->where('title', 'like', $like)->orWhere('excerpt', 'like', $like));
        }

        $this->applySorting($query, $request, self::SORTABLE);

        return $query->paginate($this->pageSize($request));
    }

    /** Member list: "current" = published, "archive" = archived; newest published first. */
    public function memberIndex(ContentType $type, string $period, Request $request): LengthAwarePaginator
    {
        $query = $this->query()->ofType($type);

        $period === 'archive' ? $query->archived() : $query->published();

        return $query
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(self::MEMBER_PAGE_SIZE);
    }

    /** Latest published items of a type (or any type), newest first. */
    public function latestPublished(int $limit, ?ContentType $type = null): Collection
    {
        return $this->query()
            ->published()
            ->when($type !== null, fn (Builder $q) => $q->ofType($type))
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    /** Content counts grouped by type and status, in one query: [{type, status, total}, …]. */
    public function countsByTypeAndStatus(): SupportCollection
    {
        return $this->query()
            ->select('type', 'status', DB::raw('COUNT(*) as total'))
            ->groupBy('type', 'status')
            ->toBase()
            ->get();
    }

    /** Most recently created items of any type and status. */
    public function latest(int $limit): Collection
    {
        return $this->query()->orderByDesc('id')->limit($limit)->get();
    }

    public function countPublished(ContentType $type): int
    {
        return $this->query()->ofType($type)->published()->count();
    }

    /** Published news whose publish date is before $before (UTC). */
    public function publishedNewsBefore(DateTimeInterface $before): Builder
    {
        return $this->query()
            ->ofType(ContentType::NEWS)
            ->published()
            ->where('published_at', '<', $before);
    }
}
