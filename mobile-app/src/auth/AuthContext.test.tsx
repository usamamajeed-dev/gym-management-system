import { QueryClient } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { client, getAuthToken } from '../api/client';
import * as authApi from '../api/endpoints/auth';
import { Member } from '../api/types';
import { AuthContextValue, AuthProvider, useAuth } from './AuthContext';
import { tokenStorage } from './tokenStorage';

jest.mock('../api/endpoints/auth');
const api = jest.mocked(authApi);

const MEMBER = { id: 7, name: 'Sara Ahmed', email: 'sara@example.com' } as Member;

const latest: { value: AuthContextValue | null } = { value: null };
const auth = () => latest.value as AuthContextValue;

function Probe() {
  const value = useAuth();
  useEffect(() => {
    latest.value = value;
  }, [value]);
  return <Text testID="status">{value.status}</Text>;
}

/** Renders the provider; Testing Library 14's render is async and flushes the boot effects. */
async function renderAuth() {
  return render(
    <AuthProvider queryClient={new QueryClient()}>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await tokenStorage.clear();
});

describe('AuthContext', () => {
  it('boots signed out when there is no stored token', async () => {
    await renderAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));
    expect(api.me).not.toHaveBeenCalled();
  });

  it('restores a stored token with /auth/me', async () => {
    await tokenStorage.set('stored-token');
    api.me.mockResolvedValue(MEMBER);

    await renderAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedIn'));
    expect(auth().member).toEqual(MEMBER);
  });

  it('login stores the token and signs in', async () => {
    api.login.mockResolvedValue({ token: 'new-token', token_type: 'Bearer', expires_at: null, user: MEMBER });
    await renderAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));

    await act(() => auth().login('sara@example.com', 'Secret@123'));

    expect(screen.getByTestId('status')).toHaveTextContent('signedIn');
    expect(await tokenStorage.get()).toBe('new-token');
    expect(getAuthToken()).toBe('new-token');
  });

  it('signs out with a notice when the API answers 401', async () => {
    api.login.mockResolvedValue({ token: 'new-token', token_type: 'Bearer', expires_at: null, user: MEMBER });
    await renderAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));
    await act(() => auth().login('sara@example.com', 'Secret@123'));

    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    client.defaults.adapter = () =>
      Promise.reject(
        new AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { success: false, message: 'Unauthenticated.' },
        }),
      );

    await act(async () => {
      await client.get('/dashboard').catch(() => undefined);
    });

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));
    expect(await tokenStorage.get()).toBeNull();
    expect(auth().notice).toMatch(/session has ended/i);
  });

  it('logout revokes the token on the server and clears it locally', async () => {
    api.login.mockResolvedValue({ token: 'new-token', token_type: 'Bearer', expires_at: null, user: MEMBER });
    api.logout.mockResolvedValue();
    await renderAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));
    await act(() => auth().login('sara@example.com', 'Secret@123'));

    await act(() => auth().logout());

    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('status')).toHaveTextContent('signedOut');
    expect(await tokenStorage.get()).toBeNull();
    expect(getAuthToken()).toBeNull();
  });

  it('logout clears the token even when the API call fails', async () => {
    api.login.mockResolvedValue({ token: 'new-token', token_type: 'Bearer', expires_at: null, user: MEMBER });
    api.logout.mockRejectedValue(new Error('offline'));
    await renderAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));
    await act(() => auth().login('sara@example.com', 'Secret@123'));

    await act(() => auth().logout());

    expect(screen.getByTestId('status')).toHaveTextContent('signedOut');
    expect(await tokenStorage.get()).toBeNull();
  });
});
