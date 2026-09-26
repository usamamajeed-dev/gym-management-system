<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ErrorCode;
use App\Exceptions\ApiException;
use App\Models\EventType;
use App\Repositories\EventTypeRepository;
use App\Services\Admin\AdminDashboardService;
use App\Services\Base\BaseService;
use App\Support\Slug;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventTypeService extends BaseService
{
    public function __construct(private EventTypeRepository $eventTypeRepository)
    {
        parent::__construct($this->eventTypeRepository);
    }

    public function list(Request $request): LengthAwarePaginator
    {
        return $this->eventTypeRepository->index($request);
    }

    public function options(): Collection
    {
        return $this->eventTypeRepository->options();
    }

    public function show(EventType $eventType): EventType
    {
        return $eventType->loadCount('events');
    }

    public function createType(array $data): EventType
    {
        return DB::transaction(function () use ($data): EventType {
            /** @var EventType $eventType */
            $eventType = $this->eventTypeRepository->create([
                ...$data,
                'slug' => Slug::unique($this->eventTypeRepository->query(), $data['name']),
            ]);

            AdminDashboardService::forgetCache();

            return $eventType->refresh()->loadCount('events');
        });
    }

    /** Renaming regenerates the slug. */
    public function updateType(EventType $eventType, array $data): EventType
    {
        return DB::transaction(function () use ($eventType, $data): EventType {
            if (isset($data['name']) && $data['name'] !== $eventType->name) {
                $data['slug'] = Slug::unique($this->eventTypeRepository->query(), $data['name'], $eventType->id);
            }

            $this->eventTypeRepository->update($eventType, $data);
            AdminDashboardService::forgetCache();

            return $eventType->loadCount('events');
        });
    }

    /** A type in use can't be deleted; deactivate it instead. */
    public function deleteType(EventType $eventType): void
    {
        if ($eventType->events()->exists()) {
            throw ApiException::conflict(
                'This event type is used by existing events.',
                null,
                ErrorCode::EVENT_TYPE_IN_USE->value,
            );
        }

        $this->eventTypeRepository->delete($eventType);
        AdminDashboardService::forgetCache();
    }
}
