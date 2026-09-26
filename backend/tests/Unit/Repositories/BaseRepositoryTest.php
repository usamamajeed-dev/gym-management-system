<?php

declare(strict_types=1);

namespace Tests\Unit\Repositories;

use App\Models\User;
use App\Repositories\Base\BaseRepository;
use Illuminate\Http\Request;
use Tests\TestCase;

/** Needs the container and config, so it extends the app TestCase. */
class BaseRepositoryTest extends TestCase
{
    // ------------------------------------------------------------ pageSize

    public function test_page_size_defaults_to_ten(): void
    {
        $this->assertSame(10, $this->repository()->exposedPageSize(new Request));
    }

    public function test_page_size_is_capped_at_the_configured_maximum(): void
    {
        $this->assertSame(100, $this->repository()->exposedPageSize(new Request(['length' => 500])));
    }

    public function test_page_size_is_at_least_one(): void
    {
        $this->assertSame(1, $this->repository()->exposedPageSize(new Request(['length' => -5])));
    }

    // ------------------------------------------------------------ likeValue

    public function test_like_value_escapes_wildcards(): void
    {
        $this->assertSame('%50\%\_off%', $this->repository()->exposedLikeValue('50%_off'));
    }

    public function test_like_value_search_matches_literal_percent_only(): void
    {
        User::factory()->create(['name' => 'Discount 50% Club']);
        User::factory()->create(['name' => 'Discount 500 Club']);

        $repository = $this->repository();
        $names = $repository->query()
            ->where('name', 'like', $repository->exposedLikeValue('50%'))
            ->pluck('name');

        $this->assertSame(['Discount 50% Club'], $names->all());
    }

    // ------------------------------------------------------------ applySorting

    public function test_apply_sorting_uses_allow_listed_column_and_direction(): void
    {
        $sql = $this->sortedSql(['column' => 'name', 'dir' => 'ASC']);

        $this->assertStringContainsString('order by `name` asc', $sql);
    }

    public function test_apply_sorting_ignores_column_not_in_allow_list(): void
    {
        $sql = $this->sortedSql(['column' => 'password', 'dir' => 'asc']);

        $this->assertStringContainsString('order by `id` desc', $sql);
        $this->assertStringNotContainsString('password', $sql);
    }

    public function test_apply_sorting_ignores_invalid_direction(): void
    {
        $sql = $this->sortedSql(['column' => 'name', 'dir' => 'sideways']);

        $this->assertStringContainsString('order by `id` desc', $sql);
    }

    // ------------------------------------------------------------ criteria

    public function test_criteria_support_equality_operators_and_where_in(): void
    {
        $a = User::factory()->create(['name' => 'Alpha']);
        User::factory()->create(['name' => 'Beta']);
        $c = User::factory()->create(['name' => 'Gamma']);

        $found = $this->repository()->get(
            ['id' => ['>=', $a->id]],
            whereIn: ['name' => ['Alpha', 'Gamma']],
        );

        $this->assertEqualsCanonicalizing([$a->id, $c->id], $found->pluck('id')->all());
        $this->assertSame(1, $this->repository()->count(['name' => 'Beta']));
    }

    // ------------------------------------------------------------ helpers

    private function sortedSql(array $input): string
    {
        $repository = $this->repository();

        return $repository->exposedApplySorting($repository->query(), new Request($input), ['id', 'name'])->toSql();
    }

    private function repository(): object
    {
        return new class extends BaseRepository
        {
            public function model(): string
            {
                return User::class;
            }

            public function exposedPageSize(Request $request): int
            {
                return $this->pageSize($request);
            }

            public function exposedLikeValue(string $search): string
            {
                return $this->likeValue($search);
            }

            public function exposedApplySorting($query, Request $request, array $sortable)
            {
                return $this->applySorting($query, $request, $sortable);
            }
        };
    }
}
