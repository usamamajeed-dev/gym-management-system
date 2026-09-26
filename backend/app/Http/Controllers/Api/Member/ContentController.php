<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Member;

use App\Enums\ContentType;
use App\Http\Controllers\Base\BaseController;
use App\Http\Requests\Member\ContentIndexRequest;
use App\Http\Resources\Content\ContentResource;
use App\Http\Resources\Content\ContentResourceCollection;
use App\Models\Content;
use App\Services\ContentService;
use Illuminate\Http\JsonResponse;

/**
 * @group Member App — News & Policies
 *
 * "current" lists published items; "archive" lists older, archived items. Drafts are never shown.
 *
 * @authenticated
 */
class ContentController extends BaseController
{
    public function __construct(private ContentService $contentService) {}

    /**
     * List news or policies
     *
     * Paginated, 10 per page, newest first. List items have no body.
     *
     * @queryParam type string required news or policy. Example: news
     * @queryParam period string current (default) or archive. Example: current
     * @queryParam page integer Page number. Example: 1
     */
    public function index(ContentIndexRequest $request): JsonResponse
    {
        $type = $request->type();

        return $this->successResponse(
            new ContentResourceCollection($this->contentService->memberList($type, $request->period(), $request)),
            ($type === ContentType::POLICY ? 'Policies' : 'News').' retrieved successfully',
        );
    }

    /**
     * Show a news item or policy
     *
     * Includes the body. 404 for drafts.
     */
    public function show(Content $content): JsonResponse
    {
        $visible = $this->contentService->findVisible($content);

        return $this->successResponse(new ContentResource($visible), "{$visible->label()} retrieved successfully");
    }
}
