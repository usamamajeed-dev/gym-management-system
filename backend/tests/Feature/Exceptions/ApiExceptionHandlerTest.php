<?php

declare(strict_types=1);

namespace Tests\Feature\Exceptions;

use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use RuntimeException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Tests\TestCase;

class ApiExceptionHandlerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::prefix('api/_test')->group(function (): void {
            Route::get('api-exception', fn () => throw ApiException::conflict('Already done.', null, 'SOME_CODE'));
            Route::get('api-exception-errors', fn () => throw new ApiException('Rejected.', 403, ['rejection_reason' => 'Bad docs'], 'MEMBER_REJECTED'));
            Route::get('validation', fn () => Validator::make([], ['email' => 'required'])->validate());
            Route::get('authentication', fn () => throw new AuthenticationException);
            Route::get('authorization', fn () => throw new AuthorizationException('Policy internals'));
            Route::get('spatie', fn () => throw UnauthorizedException::forRoles(['admin']));
            Route::get('model-not-found', fn () => User::query()->findOrFail(PHP_INT_MAX));
            Route::get('http-exception', fn () => abort(400, 'Bad input.'));
            Route::get('raw-http-exception', fn () => abort(400, 'SQLSTATE[HY000]: General error'));
            Route::get('server-error', fn () => throw new RuntimeException('SQLSTATE[42S02]: Base table or view not found'));
            Route::get('throttled', fn () => 'ok')->middleware('throttle:1,1');
        });
    }

    // ------------------------------------------------------------ ApiException

    public function test_api_exception_renders_its_status_message_and_error_code(): void
    {
        $this->getJson('/api/_test/api-exception')
            ->assertStatus(409)
            ->assertExactJson(['success' => false, 'message' => 'Already done.', 'error_code' => 'SOME_CODE']);
    }

    public function test_api_exception_includes_errors_when_given(): void
    {
        $this->getJson('/api/_test/api-exception-errors')
            ->assertStatus(403)
            ->assertJsonPath('errors.rejection_reason', 'Bad docs')
            ->assertJsonPath('error_code', 'MEMBER_REJECTED');
    }

    public function test_not_found_api_exception_renders_the_given_message(): void
    {
        Route::get('api/_test/not-found', fn () => throw ApiException::notFound('X'));

        $this->getJson('/api/_test/not-found')
            ->assertStatus(404)
            ->assertExactJson(['success' => false, 'message' => 'X']);
    }

    // ------------------------------------------------------------ framework exceptions

    public function test_validation_exception_returns_422_with_errors(): void
    {
        $this->getJson('/api/_test/validation')
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed')
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_authentication_exception_returns_401(): void
    {
        $this->getJson('/api/_test/authentication')
            ->assertStatus(401)
            ->assertExactJson(['success' => false, 'message' => 'Unauthenticated.']);
    }

    public function test_authorization_exception_returns_403_without_leaking_its_message(): void
    {
        $response = $this->getJson('/api/_test/authorization')->assertStatus(403);

        $this->assertStringNotContainsString('Policy internals', $response->getContent());
    }

    public function test_spatie_unauthorized_exception_returns_403(): void
    {
        $this->assertApiError($this->getJson('/api/_test/spatie'), 403);
    }

    public function test_model_not_found_returns_404_without_the_model_name(): void
    {
        $this->getJson('/api/_test/model-not-found')
            ->assertStatus(404)
            ->assertExactJson(['success' => false, 'message' => 'Resource not found.']);
    }

    public function test_unknown_route_returns_404_json(): void
    {
        $this->get('/api/_test/does-not-exist')
            ->assertStatus(404)
            ->assertExactJson(['success' => false, 'message' => 'Resource not found.']);
    }

    public function test_throttled_request_returns_429_with_retry_after(): void
    {
        $this->getJson('/api/_test/throttled')->assertOk();

        $this->getJson('/api/_test/throttled')
            ->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['retry_after'])
            ->assertHeader('Retry-After');
    }

    public function test_http_exception_keeps_its_status_and_safe_message(): void
    {
        $this->getJson('/api/_test/http-exception')
            ->assertStatus(400)
            ->assertExactJson(['success' => false, 'message' => 'Bad input.']);
    }

    // ------------------------------------------------------------ message sanitising

    public function test_raw_sql_message_in_http_exception_is_replaced(): void
    {
        $response = $this->getJson('/api/_test/raw-http-exception')->assertStatus(400);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_unexpected_exception_returns_generic_500_message(): void
    {
        $response = $this->getJson('/api/_test/server-error')
            ->assertStatus(500)
            ->assertExactJson(['success' => false, 'message' => 'Something went wrong. Please try again later.']);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_api_routes_render_json_even_without_accept_header(): void
    {
        $response = $this->call('GET', '/api/_test/authentication');

        $response->assertStatus(401)->assertJsonPath('message', 'Unauthenticated.');
    }
}
