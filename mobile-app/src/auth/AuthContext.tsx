import { QueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setAuthToken, setUnauthorizedHandler, UnauthorizedReason } from '../api/client';
import * as authApi from '../api/endpoints/auth';
import { Member, RegisterPayload } from '../api/types';
import { toApiError } from '../utils/errors';
import { tokenStorage } from './tokenStorage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  member: Member | null;
  token: string | null;
}

export interface AuthContextValue extends AuthState {
  /** Shown on the login screen after the session ended (expired, revoked or deactivated). */
  notice: string | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  /** Submits a registration and returns the server message. Does not log in. */
  register(payload: RegisterPayload): Promise<string>;
  setMember(member: Member): void;
  clearNotice(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOTICES: Record<UnauthorizedReason, string> = {
  session: 'Your session has ended. Please log in again.',
  inactive: 'Your membership has been deactivated. Please contact the gym.',
};

export function AuthProvider({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', member: null, token: null });
  const [notice, setNotice] = useState<string | null>(null);

  const clearSession = useCallback(
    async (message: string | null = null) => {
      setAuthToken(null);
      await tokenStorage.clear();
      queryClient.clear();
      setNotice(message);
      setState({ status: 'signedOut', member: null, token: null });
    },
    [queryClient],
  );

  // Boot: restore the stored token and check it with /auth/me.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        if (!cancelled) setState({ status: 'signedOut', member: null, token: null });
        return;
      }

      setAuthToken(token);
      try {
        const member = await authApi.me();
        if (!cancelled) setState({ status: 'signedIn', member, token });
      } catch (error) {
        const status = toApiError(error).status;
        if (status === 401 || status === 403) {
          await tokenStorage.clear();
        }
        setAuthToken(null);
        if (!cancelled) setState({ status: 'signedOut', member: null, token: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 (or MEMBER_INACTIVE) from the API signs the member out.
  useEffect(() => {
    setUnauthorizedHandler((reason) => {
      void clearSession(NOTICES[reason]);
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email.trim(), password);
      await tokenStorage.set(result.token);
      setAuthToken(result.token);
      queryClient.clear();
      setNotice(null);
      setState({ status: 'signedIn', member: result.user, token: result.token });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort: the local session is cleared even when offline.
    }
    await clearSession(null);
  }, [clearSession]);

  const register = useCallback(async (payload: RegisterPayload) => (await authApi.register(payload)).message, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      notice,
      login,
      logout,
      register,
      setMember: (member) => setState((s) => ({ ...s, member })),
      clearNotice: () => setNotice(null),
    }),
    [state, notice, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
