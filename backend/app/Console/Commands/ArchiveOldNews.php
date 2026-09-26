<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ContentService;
use Illuminate\Console\Command;

class ArchiveOldNews extends Command
{
    protected $signature = 'contents:archive-old-news';

    protected $description = 'Archive published news from before the current month (gym timezone). Policies are never archived.';

    public function handle(ContentService $contentService): int
    {
        $count = $contentService->archiveOldNews();

        $this->info("Archived {$count} news item(s).");

        return self::SUCCESS;
    }
}
