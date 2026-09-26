<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Event;
use App\Repositories\EventRepository;
use App\Services\Base\BaseService;
use App\Support\DateFormat;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Admin event management. Clients send local gym time ("2026-10-05 18:00")
 * or ISO-8601 with an offset; both are stored as UTC.
 */
class EventService extends BaseService
{
    private const IMAGE_DIRECTORY = 'events';

    public function __construct(private EventRepository $eventRepository)
    {
        parent::__construct($this->eventRepository);
    }

    public function list(Request $request): LengthAwarePaginator
    {
        return $this->eventRepository->index($request);
    }

    public function show(Event $event): Event
    {
        return $event->load(['eventType', 'createdBy']);
    }

    public function createEvent(array $data, ?UploadedFile $image): Event
    {
        $data = $this->normaliseDates($data);

        if ($image !== null) {
            $data['image_path'] = $image->store(self::IMAGE_DIRECTORY, 'public');
        }

        /** @var Event $event */
        $event = DB::transaction(fn () => $this->eventRepository->create($data));

        return $this->show($event->refresh());
    }

    /** A new image replaces the old file; remove_image deletes it. */
    public function updateEvent(Event $event, array $data, ?UploadedFile $image): Event
    {
        $data = $this->normaliseDates($data);
        $removeImage = (bool) ($data['remove_image'] ?? false);
        unset($data['remove_image']);

        $oldImage = $event->image_path;

        if ($image !== null) {
            $data['image_path'] = $image->store(self::IMAGE_DIRECTORY, 'public');
        } elseif ($removeImage) {
            $data['image_path'] = null;
        }

        DB::transaction(fn () => $this->eventRepository->update($event, $data));

        if ($oldImage !== null && array_key_exists('image_path', $data) && $data['image_path'] !== $oldImage) {
            Storage::disk('public')->delete($oldImage);
        }

        return $this->show($event);
    }

    public function deleteEvent(Event $event): void
    {
        $image = $event->image_path;

        DB::transaction(fn () => $this->eventRepository->delete($event));

        if ($image !== null) {
            Storage::disk('public')->delete($image);
        }
    }

    /** Parse starts_at / ends_at in the gym timezone and convert to UTC. */
    private function normaliseDates(array $data): array
    {
        foreach (['starts_at', 'ends_at'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null) {
                $data[$field] = Carbon::parse($data[$field], DateFormat::timezone())->utc();
            }
        }

        return $data;
    }
}
