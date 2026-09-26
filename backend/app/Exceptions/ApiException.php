<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

/**
 * An expected, client-facing API error.
 *
 * Services throw it for business-rule failures; ApiExceptionHandler renders it
 * as { success: false, message, errors?, error_code? } with the given status.
 * The message is shown to API clients, so it must never contain internals.
 */
class ApiException extends RuntimeException
{
    public function __construct(
        string $message = ApiExceptionHandler::GENERIC_MESSAGE,
        protected int $status = 400,
        protected ?array $errors = null,
        protected ?string $errorCode = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public static function unprocessable(
        string $message = ApiExceptionHandler::VALIDATION_MESSAGE,
        ?array $errors = null,
        ?string $errorCode = null,
    ): self {
        return new self($message, 422, $errors, $errorCode);
    }

    public static function notFound(string $message = 'Resource not found.', ?string $errorCode = null): self
    {
        return new self($message, 404, null, $errorCode);
    }

    public static function forbidden(
        string $message = 'You do not have permission to perform this action.',
        ?string $errorCode = null,
    ): self {
        return new self($message, 403, null, $errorCode);
    }

    public static function conflict(string $message, ?array $errors = null, ?string $errorCode = null): self
    {
        return new self($message, 409, $errors, $errorCode);
    }

    public static function unauthorized(string $message = 'Unauthenticated.', ?string $errorCode = null): self
    {
        return new self($message, 401, null, $errorCode);
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getErrors(): ?array
    {
        return $this->errors;
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    public function toResponse(): JsonResponse
    {
        return ApiExceptionHandler::json($this->status, $this->getMessage(), $this->errors, $this->errorCode);
    }
}
