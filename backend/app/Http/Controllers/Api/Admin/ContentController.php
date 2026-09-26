<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ContentType;
use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Admin\Content\StoreContentRequest;
use App\Http\Requests\Admin\Content\UpdateContentRequest;
use App\Http\Resources\Content\ContentResource;
use App\Http\Resources\Content\ContentResourceCollection;
use App\Models\Content;
use App\Services\ContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group Admin Portal — News & Policies
 *
 * News items and policies share these endpoints ("type" = news or policy).
 * Lifecycle: draft → published → archived; archived items can be re-published.
 * Invalid transitions return 409 with error_code INVALID_CONTENT_TRANSITION.
 * Send create and update with an image as multipart; for updates, use POST with _method=PUT.
 *
 * @authenticated
 */
class ContentController extends BaseController
{
    public function __construct(private ContentService $contentService) {}

    /**
     * List news and policies
     *
     * @queryParam type string news or policy. Example: news
     * @queryParam status string draft, published or archived. Example: published
     * @queryParam search string Title or excerpt. Example: holiday
     * @queryParam column string Sort column: id, title, published_at, created_at. Example: published_at
     * @queryParam dir string asc or desc. Example: desc
     * @queryParam length integer Page size (max 100). Example: 10
     * @queryParam page integer Page number. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        $label = match (ContentType::tryFrom((string) $request->input('type'))) {
            ContentType::NEWS => 'News',
            ContentType::POLICY => 'Policies',
            null => 'Contents',
        };

        return $this->successResponse(
            new ContentResourceCollection($this->contentService->list($request)),
            "{$label} retrieved successfully",
        );
    }

    /**
     * Create a news item or policy
     *
     * Saved as draft unless status=published.
     */
    public function store(StoreContentRequest $request): JsonResponse
    {
        $content = $this->contentService->createContent($request->safe()->except('image'), $request->file('image'));

        return $this->successResponse(new ContentResource($content), "{$content->label()} created successfully", 201);
    }

    /**
     * Show a news item or policy
     */
    public function show(Content $content): JsonResponse
    {
        return $this->successResponse(new ContentResource($content), "{$content->label()} retrieved successfully");
    }

    /**
     * Update a news item or policy
     *
     * Text and image only; type and status can't be changed here. Send remove_image=1 to delete the image.
     */
    public function update(UpdateContentRequest $request, Content $content): JsonResponse
    {
        $updated = $this->contentService->updateContent($content, $request->safe()->except('image'), $request->file('image'));

        return $this->successResponse(new ContentResource($updated), "{$updated->label()} updated successfully");
    }

    /**
     * Delete a news item or policy
     *
     * Also deletes its image.
     */
    public function destroy(Content $content): JsonResponse
    {
        $label = $content->label();
        $this->contentService->deleteContent($content);

        return $this->successResponse(null, "{$label} deleted successfully");
    }

    /**
     * Publish
     *
     * Draft or archived → published.
     */
    public function publish(Content $content): JsonResponse
    {
        $published = $this->contentService->publish($content);

        return $this->successResponse(new ContentResource($published), "{$published->label()} published successfully");
    }

    /**
     * Archive
     *
     * Published → archived. Members see archived items under "older".
     */
    public function archive(Content $content): JsonResponse
    {
        $archived = $this->contentService->archive($content);

        return $this->successResponse(new ContentResource($archived), "{$archived->label()} archived successfully");
    }
}
