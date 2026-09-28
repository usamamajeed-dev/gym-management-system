import { isAxiosError } from 'axios';

import { ApiError } from '../api/types';

export const NETWORK_ERROR_MESSAGE = 'No connection. Check your internet and try again.';
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** Turns any thrown value into the API error shape the screens use. */
export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { message: NETWORK_ERROR_MESSAGE, network: true };
    }

    const body = error.response.data as Partial<ApiError> | undefined;

    return {
      message: typeof body?.message === 'string' ? body.message : GENERIC_ERROR_MESSAGE,
      status: error.response.status,
      errors: body?.errors,
      error_code: body?.error_code,
      retry_after: body?.retry_after,
    };
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return { message: error.message };
  }

  return { message: GENERIC_ERROR_MESSAGE };
}

/** True for 4xx responses, which retrying won't fix. */
export function isClientError(error: unknown): boolean {
  const status = toApiError(error).status;
  return status !== undefined && status >= 400 && status < 500;
}
