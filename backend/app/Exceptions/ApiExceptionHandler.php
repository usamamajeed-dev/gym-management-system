<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Renders every exception on an API request as the standard error envelope:
 * { success: false, message, errors?, error_code? }.
 *
 * Unexpected exceptions become a generic 500. Laravel's reporting pipeline has
 * already logged the original, so nothing internal ever reaches the client.
 */
class ApiExceptionHandler
{
    public const GENERIC_MESSAGE = 'Something went wrong. Please try again later.';

    public const VALIDATION_MESSAGE = 'Validation failed';

    /** Patterns that mark a message as internal (SQL, PHP errors, file paths, class names). */
    private const RAW_PATTERNS = [
        '/SQLSTATE/i',
        '/\bSQL\b.*\b(select|insert|update|delete)\b/i',
        '/stack trace/i',
        '/\.php\b/i',
        '/\bon line \d+/i',
        '/Call to (undefined|a member|private|protected)/i',
        '/Undefined (variable|index|offset|array key|property|method|constant)/i',
        '/Class ["\']?[\w\\\\]+["\']? not found/i',
        '/must be of type/i',
        '/Too few arguments/i',
        '/syntax error/i',
        '/Connection refused/i',
        '/No query results for model/i',
        '/\b[A-Z][A-Za-z0-9_]*\\\\[A-Z][A-Za-z0-9_\\\\]*/',
    ];

    /** Render as JSON for every api/* route and any client that asks for JSON. */
    public static function shouldRender(Request $request): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }

    public static function render(Throwable $e, Request $request): JsonResponse
    {
        return self::fromThrowable($e);
    }

    public static function fromThrowable(Throwable $e): JsonResponse
    {
        return match (true) {
            $e instanceof ApiException => $e->toResponse(),

            $e instanceof ValidationException => self::json(422, self::VALIDATION_MESSAGE, $e->errors()),

            $e instanceof AuthenticationException => self::json(401, 'Unauthenticated.'),

            $e instanceof AuthorizationException,
            $e instanceof UnauthorizedException,
            $e instanceof AccessDeniedHttpException => self::json(403, self::defaultMessageForStatus(403)),

            $e instanceof ModelNotFoundException,
            $e instanceof NotFoundHttpException => self::json(404, self::defaultMessageForStatus(404)),

            $e instanceof ThrottleRequestsException => self::json(
                429,
                self::defaultMessageForStatus(429),
                extra: ['retry_after' => (int) ($e->getHeaders()['Retry-After'] ?? 60)],
                headers: $e->getHeaders(),
            ),

            $e instanceof HttpExceptionInterface => self::json(
                self::normalizeStatus($e->getStatusCode()),
                self::sanitizeMessage($e->getMessage(), self::normalizeStatus($e->getStatusCode())),
                headers: $e->getHeaders(),
            ),

            default => self::json(500, self::GENERIC_MESSAGE),
        };
    }

    /** Build the standard error envelope. Optional keys are omitted when empty. */
    public static function json(
        int $status,
        string $message,
        ?array $errors = null,
        ?string $errorCode = null,
        array $extra = [],
        array $headers = [],
    ): JsonResponse {
        $body = ['success' => false, 'message' => $message];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        if ($errorCode !== null) {
            $body['error_code'] = $errorCode;
        }

        return new JsonResponse(array_merge($body, $extra), self::normalizeStatus($status), $headers);
    }

    /** Only 4xx/5xx are valid error statuses; anything else becomes 500. */
    public static function normalizeStatus(int $status): int
    {
        return $status >= 400 && $status <= 599 ? $status : 500;
    }

    /** Keep safe, human-written messages; replace empty or internal ones with the status default. */
    public static function sanitizeMessage(string $message, int $status): string
    {
        $message = trim($message);

        if ($message === '' || $status >= 500 || self::looksRaw($message)) {
            return self::defaultMessageForStatus($status);
        }

        return $message;
    }

    public static function looksRaw(string $message): bool
    {
        foreach (self::RAW_PATTERNS as $pattern) {
            if (preg_match($pattern, $message) === 1) {
                return true;
            }
        }

        return false;
    }

    public static function defaultMessageForStatus(int $status): string
    {
        return match ($status) {
            400 => 'Bad request.',
            401 => 'Unauthenticated.',
            403 => 'You do not have permission to perform this action.',
            404 => 'Resource not found.',
            405 => 'Method not allowed.',
            409 => 'The request conflicts with the current state of the resource.',
            413 => 'The uploaded content is too large.',
            419 => 'Your session has expired. Please try again.',
            422 => self::VALIDATION_MESSAGE,
            429 => 'Too many requests. Please try again later.',
            503 => 'Service unavailable. Please try again later.',
            default => self::GENERIC_MESSAGE,
        };
    }
}
