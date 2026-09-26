<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Enums\MemberStatus;
use App\Http\Resources\Content\ContentListResource;
use App\Http\Resources\Event\EventResource;
use App\Http\Resources\GymTiming\GymTimingResource;
use App\Http\Resources\Member\MemberResource;
use App\Repositories\ContentRepository;
use App\Repositories\EventRepository;
use App\Repositories\UserRepository;
use App\Services\GymTimingService;
use App\Support\DateFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * The admin portal's overview page in one response, cached briefly.
 * Every write that changes one of these numbers calls forgetCache().
 */
class AdminDashboardService
{
    public const CACHE_KEY = 'admin.dashboard';

    private const CACHE_SECONDS = 60;

    private const LIST_SIZE = 5;

    private const REGISTRATION_MONTHS = 6;

    public function __construct(
        private UserRepository $userRepository,
        private EventRepository $eventRepository,
        private ContentRepository $contentRepository,
        private GymTimingService $gymTimingService,
    ) {}

    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function build(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn (): array => $this->compute());
    }

    private function compute(): array
    {
        $now = CarbonImmutable::now(DateFormat::timezone());
        $registrations = $this->registrationsByMonth($now);
        $today = $this->gymTimingService->today();

        return [
            'members' => [
                ...$this->memberCounts(),
                'new_this_month' => end($registrations)['count'],
            ],
            'registrations_by_month' => $registrations,
            'pending_members' => MemberResource::collection($this->userRepository->oldestPending(self::LIST_SIZE))->resolve(),
            'recent_members' => MemberResource::collection($this->userRepository->newestMembers(self::LIST_SIZE))->resolve(),
            'events' => [
                ...$this->eventRepository->dashboardCounts($now),
                'next' => EventResource::collection($this->eventRepository->upcoming(self::LIST_SIZE))->resolve(),
            ],
            'contents' => [
                ...$this->contentCounts(),
                'latest' => ContentListResource::collection($this->contentRepository->latest(self::LIST_SIZE))->resolve(),
            ],
            'gym' => [
                'is_open_now' => $this->gymTimingService->isOpenNow($today),
                'today_timing' => $today !== null ? (new GymTimingResource($today))->resolve() : null,
                'timezone' => DateFormat::timezone(),
            ],
        ];
    }

    /** @return array{total: int, pending: int, approved: int, rejected: int, active: int, inactive: int} */
    private function memberCounts(): array
    {
        $rows = $this->userRepository->memberCountsByStatus();

        $sum = fn (callable $filter): int => (int) $rows->filter($filter)->sum('total');
        $approved = fn (object $row): bool => $row->status === MemberStatus::APPROVED->value;

        return [
            'total' => $sum(fn (): bool => true),
            'pending' => $sum(fn (object $row): bool => $row->status === MemberStatus::PENDING->value),
            'approved' => $sum($approved),
            'rejected' => $sum(fn (object $row): bool => $row->status === MemberStatus::REJECTED->value),
            'active' => $sum(fn (object $row): bool => $approved($row) && (bool) $row->is_active),
            'inactive' => $sum(fn (object $row): bool => $approved($row) && ! $row->is_active),
        ];
    }

    /**
     * Registrations for the last six months including this one (gym time), oldest first,
     * with zero for months that had none. Grouped in PHP so it doesn't depend on MySQL
     * timezone tables.
     *
     * @return list<array{month: string, count: int}>
     */
    private function registrationsByMonth(CarbonImmutable $now): array
    {
        $firstMonth = $now->startOfMonth()->subMonths(self::REGISTRATION_MONTHS - 1);

        $counts = $this->userRepository
            ->memberRegistrationDatesSince($firstMonth->utc())
            ->map(fn (mixed $createdAt): string => Carbon::parse($createdAt, 'UTC')->setTimezone(DateFormat::timezone())->format('Y-m'))
            ->countBy();

        return Collection::times(self::REGISTRATION_MONTHS, fn (int $i): string => $firstMonth->addMonths($i - 1)->format('Y-m'))
            ->map(fn (string $month): array => ['month' => $month, 'count' => (int) ($counts[$month] ?? 0)])
            ->values()
            ->all();
    }

    /** @return array{news_published: int, policies_published: int, drafts: int, archived: int} */
    private function contentCounts(): array
    {
        $rows = $this->contentRepository->countsByTypeAndStatus();

        $sum = fn (?ContentType $type, ContentStatus $status): int => (int) $rows
            ->filter(fn (object $row): bool => $row->status === $status->value && ($type === null || $row->type === $type->value))
            ->sum('total');

        return [
            'news_published' => $sum(ContentType::NEWS, ContentStatus::PUBLISHED),
            'policies_published' => $sum(ContentType::POLICY, ContentStatus::PUBLISHED),
            'drafts' => $sum(null, ContentStatus::DRAFT),
            'archived' => $sum(null, ContentStatus::ARCHIVED),
        ];
    }
}
