<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ContentStatus;
use App\Enums\ErrorCode;
use App\Exceptions\ApiException;
use App\Models\Content;
use App\Repositories\ContentRepository;
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

        return $content->refresh();
    }

    /**
     * Archive published news from before the current month (gym time).
     * Policies are never archived automatically. Returns the number archived.
     */
    public function archiveOldNews(): int
    {
        $monthStart = Carbon::now(DateFormat::timezone())->startOfMonth()->utc();

        return $this->contentRepository->publishedNewsBefore($monthStart)->update([
            'status' => ContentStatus::ARCHIVED->value,
            'archived_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function deleteContent(Content $content): void
    {
        $image = $content->image_path;

        DB::transaction(fn () => $this->contentRepository->delete($content));

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
