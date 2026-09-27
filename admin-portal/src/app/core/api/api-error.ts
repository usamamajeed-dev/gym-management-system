import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorBody } from './api.models';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Check your connection and try again.';

/** Normalise any HTTP failure into the API error envelope. */
export function toApiError(error: unknown): ApiErrorBody {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiErrorBody> | null;

    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return {
        success: false,
        message: body.message,
        errors: body.errors,
        error_code: body.error_code,
        retry_after: body.retry_after,
      };
    }

    return { success: false, message: error.status === 0 ? NETWORK_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE };
  }

  return { success: false, message: GENERIC_ERROR_MESSAGE };
}

export function errorStatus(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}

export function errorCode(error: unknown): string | undefined {
  return toApiError(error).error_code;
}
