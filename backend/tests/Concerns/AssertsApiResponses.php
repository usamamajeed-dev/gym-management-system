<?php

declare(strict_types=1);

namespace Tests\Concerns;

use Illuminate\Testing\TestResponse;

trait AssertsApiResponses
{
    /** A paginated list: data.list has $count items and data.pagination has every key. */
    protected function assertPaginated(TestResponse $response, int $count): void
    {
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount($count, 'data.list')
            ->assertJsonStructure([
                'data' => [
                    'list',
                    'pagination' => ['total', 'count', 'per_page', 'current_page', 'total_pages'],
                ],
            ]);
    }

    /** The standard error envelope with the given status (and error_code, when given). */
    protected function assertApiError(TestResponse $response, int $status, ?string $errorCode = null): void
    {
        $response->assertStatus($status)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['message']);

        if ($errorCode !== null) {
            $response->assertJsonPath('error_code', $errorCode);
        }
    }
}
