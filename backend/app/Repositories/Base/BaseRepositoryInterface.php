<?php

declare(strict_types=1);

namespace App\Repositories\Base;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * $criteria: ['column' => value] for "=", or ['column' => [operator, value]].
 * $whereIn:  ['column' => [value, ...]].
 */
interface BaseRepositoryInterface
{
    public function all(array $columns = ['*'], array $relations = []): Collection;

    public function get(array $criteria = [], array $columns = ['*'], array $relations = [], array $whereIn = []): Collection;

    public function first(array $criteria = [], array $columns = ['*'], array $relations = [], array $whereIn = []): ?Model;

    public function find(int|string $id, array $columns = ['*'], array $relations = []): ?Model;

    public function findOrFail(int|string $id, array $columns = ['*'], array $relations = []): Model;

    public function findBy(string $column, mixed $value, array $columns = ['*'], array $relations = []): ?Model;

    public function findWhere(array $criteria, array $columns = ['*'], array $relations = [], array $whereIn = []): Collection;

    public function create(array $data): Model;

    public function createMany(array $rows): Collection;

    public function update(Model|int|string $model, array $data): Model;

    public function updateOrCreate(array $attributes, array $values = []): Model;

    public function delete(Model|int|string $model): bool;

    public function exists(array $criteria = [], array $whereIn = []): bool;

    public function count(array $criteria = [], array $whereIn = []): int;

    public function paginate(
        int $perPage = 10,
        array $criteria = [],
        array $columns = ['*'],
        array $relations = [],
        array $whereIn = [],
    ): LengthAwarePaginator;

    public function query(): Builder;

    public function getModel(): Model;

    public function makeModel(): Model;

    public function deleteWhereIn(string $column, array $values): int;
}
