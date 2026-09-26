<?php

declare(strict_types=1);

namespace App\Services\Base;

use App\Repositories\Base\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Business rules live in services. This base passes every repository method
 * through, so a concrete service only adds rules, transactions and ApiExceptions:
 *
 *   public function __construct(private EventRepository $eventRepository)
 *   {
 *       parent::__construct($this->eventRepository);
 *   }
 */
abstract class BaseService
{
    public function __construct(protected BaseRepository $repository) {}

    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->repository->all($columns, $relations);
    }

    public function get(array $criteria = [], array $columns = ['*'], array $relations = [], array $whereIn = []): Collection
    {
        return $this->repository->get($criteria, $columns, $relations, $whereIn);
    }

    public function first(array $criteria = [], array $columns = ['*'], array $relations = [], array $whereIn = []): ?Model
    {
        return $this->repository->first($criteria, $columns, $relations, $whereIn);
    }

    public function find(int|string $id, array $columns = ['*'], array $relations = []): ?Model
    {
        return $this->repository->find($id, $columns, $relations);
    }

    public function findOrFail(int|string $id, array $columns = ['*'], array $relations = []): Model
    {
        return $this->repository->findOrFail($id, $columns, $relations);
    }

    public function findBy(string $column, mixed $value, array $columns = ['*'], array $relations = []): ?Model
    {
        return $this->repository->findBy($column, $value, $columns, $relations);
    }

    public function findWhere(array $criteria, array $columns = ['*'], array $relations = [], array $whereIn = []): Collection
    {
        return $this->repository->findWhere($criteria, $columns, $relations, $whereIn);
    }

    public function create(array $data): Model
    {
        return $this->repository->create($data);
    }

    public function createMany(array $rows): Collection
    {
        return $this->repository->createMany($rows);
    }

    public function update(Model|int|string $model, array $data): Model
    {
        return $this->repository->update($model, $data);
    }

    public function updateOrCreate(array $attributes, array $values = []): Model
    {
        return $this->repository->updateOrCreate($attributes, $values);
    }

    public function delete(Model|int|string $model): bool
    {
        return $this->repository->delete($model);
    }

    public function exists(array $criteria = [], array $whereIn = []): bool
    {
        return $this->repository->exists($criteria, $whereIn);
    }

    public function count(array $criteria = [], array $whereIn = []): int
    {
        return $this->repository->count($criteria, $whereIn);
    }

    public function paginate(
        int $perPage = 10,
        array $criteria = [],
        array $columns = ['*'],
        array $relations = [],
        array $whereIn = [],
    ): LengthAwarePaginator {
        return $this->repository->paginate($perPage, $criteria, $columns, $relations, $whereIn);
    }

    public function query(): Builder
    {
        return $this->repository->query();
    }

    public function getModel(): Model
    {
        return $this->repository->getModel();
    }

    public function makeModel(): Model
    {
        return $this->repository->makeModel();
    }

    public function deleteWhereIn(string $column, array $values): int
    {
        return $this->repository->deleteWhereIn($column, $values);
    }
}
