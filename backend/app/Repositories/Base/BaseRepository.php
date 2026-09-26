<?php

declare(strict_types=1);

namespace App\Repositories\Base;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;

/**
 * All Eloquent queries live in repositories. Concrete repositories only
 * implement model() and are auto-wired by class name (no interface bindings).
 */
abstract class BaseRepository implements BaseRepositoryInterface
{
    protected Model $model;

    public function __construct()
    {
        $this->makeModel();
    }

    /** @return class-string<Model> */
    abstract public function model(): string;

    public function makeModel(): Model
    {
        $model = app($this->model());

        if (! $model instanceof Model) {
            throw new InvalidArgumentException("Class {$this->model()} must be an instance of ".Model::class);
        }

        return $this->model = $model;
    }

    public function getModel(): Model
    {
        return $this->model;
    }

    public function query(): Builder
    {
        return $this->model->newQuery();
    }

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->query()->with($relations)->get($columns);
    }

    public function get(array $criteria = [], array $columns = ['*'], array $relations = [], array $whereIn = []): Collection
    {
        return $this->applyCriteria($this->query()->with($relations), $criteria, $whereIn)->get($columns);
    }

    public function first(array $criteria = [], array $columns = ['*'], array $relations = [], array $whereIn = []): ?Model
    {
        return $this->applyCriteria($this->query()->with($relations), $criteria, $whereIn)->first($columns);
    }

    public function find(int|string $id, array $columns = ['*'], array $relations = []): ?Model
    {
        return $this->query()->with($relations)->find($id, $columns);
    }

    public function findOrFail(int|string $id, array $columns = ['*'], array $relations = []): Model
    {
        return $this->query()->with($relations)->findOrFail($id, $columns);
    }

    public function findBy(string $column, mixed $value, array $columns = ['*'], array $relations = []): ?Model
    {
        return $this->query()->with($relations)->where($column, $value)->first($columns);
    }

    public function findWhere(array $criteria, array $columns = ['*'], array $relations = [], array $whereIn = []): Collection
    {
        return $this->get($criteria, $columns, $relations, $whereIn);
    }

    public function create(array $data): Model
    {
        return $this->query()->create($data);
    }

    public function createMany(array $rows): Collection
    {
        return $this->model->newCollection(array_map(fn (array $row): Model => $this->create($row), $rows));
    }

    public function update(Model|int|string $model, array $data): Model
    {
        $model = $model instanceof Model ? $model : $this->findOrFail($model);
        $model->update($data);

        return $model;
    }

    public function updateOrCreate(array $attributes, array $values = []): Model
    {
        return $this->query()->updateOrCreate($attributes, $values);
    }

    public function delete(Model|int|string $model): bool
    {
        $model = $model instanceof Model ? $model : $this->findOrFail($model);

        return (bool) $model->delete();
    }

    public function exists(array $criteria = [], array $whereIn = []): bool
    {
        return $this->applyCriteria($this->query(), $criteria, $whereIn)->exists();
    }

    public function count(array $criteria = [], array $whereIn = []): int
    {
        return $this->applyCriteria($this->query(), $criteria, $whereIn)->count();
    }

    public function paginate(
        int $perPage = 10,
        array $criteria = [],
        array $columns = ['*'],
        array $relations = [],
        array $whereIn = [],
    ): LengthAwarePaginator {
        return $this->applyCriteria($this->query()->with($relations), $criteria, $whereIn)->paginate($perPage, $columns);
    }

    public function deleteWhereIn(string $column, array $values): int
    {
        return $this->query()->whereIn($column, $values)->delete();
    }

    /** The one place that turns $criteria / $whereIn arrays into where clauses. */
    protected function applyCriteria(Builder $query, array $criteria = [], array $whereIn = []): Builder
    {
        foreach ($criteria as $key => $value) {
            if (is_array($value)) {
                [$operator, $val] = $value;
                $query->where($key, $operator, $val);
            } else {
                $query->where($key, $value);
            }
        }

        foreach ($whereIn as $column => $values) {
            $query->whereIn($column, $values);
        }

        return $query;
    }

    /** Escape LIKE wildcards in user search input. */
    protected function likeValue(string $search): string
    {
        return '%'.addcslashes($search, '%_\\').'%';
    }

    /** Page size from ?length, default 10, capped at config('gym.list_max_length'). */
    protected function pageSize(Request $request, int $default = 10): int
    {
        $length = (int) $request->input('length', $default);

        return max(1, min($length, (int) config('gym.list_max_length', 100)));
    }

    /** Apply ?column&dir only when both are allow-listed; otherwise $defaultColumn desc. */
    protected function applySorting(Builder $query, Request $request, array $sortable, string $defaultColumn = 'id'): Builder
    {
        $column = $request->input('column');
        $dir = strtolower((string) $request->input('dir'));

        if (in_array($column, $sortable, true) && in_array($dir, ['asc', 'desc'], true)) {
            return $query->orderBy($column, $dir);
        }

        return $query->orderBy($defaultColumn, 'desc');
    }
}
