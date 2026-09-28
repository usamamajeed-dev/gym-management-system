import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

import { NETWORK_ERROR_MESSAGE, toApiError } from './errors';

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', String(status), config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

describe('toApiError', () => {
  it('maps a network failure to the no-connection message', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK', config));

    expect(error).toEqual({ message: NETWORK_ERROR_MESSAGE, network: true });
  });

  it('keeps field errors from a 422', () => {
    const error = toApiError(
      httpError(422, { success: false, message: 'Validation failed', errors: { email: ['Taken.'] } }),
    );

    expect(error.status).toBe(422);
    expect(error.message).toBe('Validation failed');
    expect(error.errors).toEqual({ email: ['Taken.'] });
  });

  it('keeps the error code of a 403 MEMBER_PENDING', () => {
    const error = toApiError(
      httpError(403, {
        success: false,
        message: 'Your registration is awaiting admin approval.',
        error_code: 'MEMBER_PENDING',
      }),
    );

    expect(error.status).toBe(403);
    expect(error.error_code).toBe('MEMBER_PENDING');
    expect(error.message).toBe('Your registration is awaiting admin approval.');
  });

  it('falls back to a generic message for unexpected values', () => {
    expect(toApiError(undefined).message).toMatch(/something went wrong/i);
  });
});
