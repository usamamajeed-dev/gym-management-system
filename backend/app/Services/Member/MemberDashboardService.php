<?php

declare(strict_types=1);

namespace App\Services\Member;

use App\Enums\ContentType;
use App\Http\Resources\Content\ContentListResource;
use App\Http\Resources\Event\EventResource;
use App\Http\Resources\GymTiming\GymTimingResource;
use App\Http\Resources\Member\MemberResource;
use App\Models\User;
use App\Repositories\ContentRepository;
use App\Repositories\EventRepository;
use App\Services\GymTimingService;
use App\Support\DateFormat;
use Carbon\CarbonImmutable;

/** Everything the member app's home screen shows, in one response. */
class MemberDashboardService
{
    private const UPCOMING_EVENTS = 3;

    private const LATEST_NEWS = 3;

    public function __construct(
        private GymTimingService $gymTimingService,
        private EventRepository $eventRepository,
        private ContentRepository $contentRepository,
    ) {}

    public function build(User $member): array
    {
        $today = $this->gymTimingService->today();

        return [
            'member' => new MemberResource($member),
            'gym' => [
                'name' => config('gym.name'),
                'timezone' => DateFormat::timezone(),
            ],
            'today_timing' => $today !== null ? new GymTimingResource($today) : null,
            'is_open_now' => $this->gymTimingService->isOpenNow(),
            'upcoming_events' => EventResource::collection($this->eventRepository->upcoming(self::UPCOMING_EVENTS)),
            'latest_news' => ContentListResource::collection(
                $this->contentRepository->latestPublished(self::LATEST_NEWS, ContentType::NEWS),
            ),
            'counts' => [
                'events_this_month' => $this->eventRepository->countForMonth(CarbonImmutable::now(DateFormat::timezone())),
                'policies' => $this->contentRepository->countPublished(ContentType::POLICY),
            ],
        ];
    }
}
