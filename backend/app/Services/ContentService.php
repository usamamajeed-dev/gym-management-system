<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Enums\ErrorCode;
use App\Exceptions\ApiException;
use App\Models\Content;
use App\Repositories\ContentRepository;
use App\Services\Admin\AdminDashboardService;
use App\Services\Base\BaseService;
use App\Support\DateFormat;
use App\Support\Slug;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * News and policies. Status changes only through publish() and archive():
 *
 *   draft → published → archived → published (re-publish)
 */
class ContentService extends BaseService
{
    private const IMAGE_DIRECTORY = 'contents';

    public function __construct(private ContentRepository $contentRepository)
    {
        parent::__construct($this->contentRepository);
    }

    public function list(Request $request): LengthAwarePaginator
    {
        return $this->contentRepository->index($request);
    }

    /** Member list: "current" = published, "archive" = archived. */
    public function memberList(ContentType $type, string $period, Request $request): LengthAwarePaginator
    {
        return $this->contentRepository->memberIndex($type, $period, $request);
    }

    /** Published or archived content for members; drafts are reported as not found. */
    public function findVisible(Content $content): Content
    {
        if ($content->status === ContentStatus::DRAFT) {
            throw ApiException::notFound("{$content->label()} not found");
        }

        return $content;
    }

    public function createContent(array $data, ?UploadedFile $image): Content
    {
        $status = ContentStatus::tryFrom((string) ($data['status'] ?? '')) ?? ContentStatus::DRAFT;

        $data['status'] = $status;
        $data['slug'] = Slug::unique($this->contentRepository->query(), $data['title']);
        $data['published_at'] = $status === ContentStatus::PUBLISHED ? now() : null;

        if ($image !== null) {
            $data['image_path'] = $image->store(self::IMAGE_DIRECTORY, 'public');
        }

        /** @var Content $content */
        $content = DB::transaction(fn () => $this->contentRepository->create($data));
        AdminDashboardService::forgetCache();

        return $content->refresh();
    }

    /**
     * Updates text and image only. The slug follows the title until the item is
     * first published, then stays fixed so shared links keep working.
     */
    public function updateContent(Content $content, array $data, ?UploadedFile $image): Content
    {
        $removeImage = (bool) ($data['remove_image'] ?? false);
        unset($data['remove_image'], $data['type'], $data['status']);

        if (isset($data['title']) && $data['title'] !== $content->title && $content->published_at === null) {
            $data['slug'] = Slug::unique($this->contentRepository->query(), $data['title'], $content->id);
        }

        $oldImage = $content->image_path;

        if ($image !== null) {
            $data['image_path'] = $image->store(self::IMAGE_DIRECTORY, 'public');
        } elseif ($removeImage) {
            $data['image_path'] = null;
        }

        DB::transaction(fn () => $this->contentRepository->update($content, $data));
        AdminDashboardService::forgetCache();

        if ($oldImage !== null && array_key_exists('image_path', $data) && $data['image_path'] !== $oldImage) {
            Storage::disk('public')->delete($oldImage);
        }

        return $content->refresh();
    }

    /** Draft or archived → published. The first publish date is kept on re-publish. */
    public function publish(Content $content): Content
    {
        if (! in_array($content->status, [ContentStatus::DRAFT, ContentStatus::ARCHIVED], true)) {
            throw $this->invalidTransition("This {$this->noun($content)} is already published.");
        }

        $this->contentRepository->update($content, [
            'status' => ContentStatus::PUBLISHED,
            'published_at' => $content->published_at ?? now(),
            'archived_at' => null,
        ]);
        AdminDashboardService::forgetCache();

        return $content->refresh();
    }

    /** Published → archived. */
    public function archive(Content $content): Content
    {
        if ($content->status !== ContentStatus::PUBLISHED) {
            throw $this->invalidTransition("Only a published {$this->noun($content)} can be archived.");
        }

        $this->contentRepository->update($content, [
            'status' => ContentStatus::ARCHIVED,
            'archived_at' => now(),
        ]);
        AdminDashboardService::forgetCache();

        return $content->refresh();
    }

    /**
     * Archive published news from before the current month (gym time).
     * Policies are never archived automatically. Returns the number archived.
     */
    public function archiveOldNews(): int
    {
        $monthStart = Carbon::now(DateFormat::timezone())->startOfMonth()->utc();

        $count = $this->contentRepository->publishedNewsBefore($monthStart)->update([
            'status' => ContentStatus::ARCHIVED->value,
            'archived_at' => now(),
            'updated_at' => now(),
        ]);

        if ($count > 0) {
            AdminDashboardService::forgetCache();
        }

        return $count;
    }

    public function deleteContent(Content $content): void
    {
        $image = $content->image_path;

        DB::transaction(fn () => $this->contentRepository->delete($content));
        AdminDashboardService::forgetCache();

        if ($image !== null) {
            Storage::disk('public')->delete($image);
        }
    }

    private function noun(Content $content): string
    {
        return strtolower($content->label()) === 'news' ? 'news item' : 'policy';
    }

    private function invalidTransition(string $message): ApiException
    {
        return ApiException::conflict($message, null, ErrorCode::INVALID_CONTENT_TRANSITION->value);
    }
}
