<?php

declare(strict_types=1);

namespace App\Http\Controllers\Base;

use App\Exceptions\ApiException;
use App\Exceptions\ApiExceptionHandler;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Base for every API controller: builds the standard response envelope.
 *
 * Actions don't catch exceptions; ApiException, ModelNotFoundException and
 * ValidationException bubble up to ApiExceptionHandler. Use exceptionResponse()
 * only when an action must catch (e.g. to degrade a third-party call gracefully).
 */
abstract class BaseController extends Controller
{
    /** { success: true, message, data } */
    protected function successResponse(mixed $data, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /** { success: false, message, errors? } */
    protected function errorResponse(string $message, int $status = 500, mixed $errors = null): JsonResponse
    {
        $body = ['success' => false, 'message' => $message];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        return response()->json($body, ApiExceptionHandler::normalizeStatus($status));
    }

    protected function validationErrorResponse(ValidationException $e): JsonResponse
    {
        return $this->errorResponse(ApiExceptionHandler::VALIDATION_MESSAGE, 422, $e->errors());
    }

    /**
     * Render a caught exception. Expected API errors keep their status and message;
     * anything else is reported and answered with $fallbackMessage, never $e->getMessage().
     */
    protected function exceptionResponse(Throwable $e, string $fallbackMessage = 'An unexpected error occurred'): JsonResponse
    {
        if ($e instanceof ApiException) {
            return $e->toResponse();
        }

        if ($e instanceof ValidationException) {
            return $this->validationErrorResponse($e);
        }

        report($e);

        return $this->errorResponse($fallbackMessage, 500);
    }
}
