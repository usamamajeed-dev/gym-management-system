import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { isClientError } from '../utils/errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // One retry for network/server errors; 4xx won't get better by retrying.
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

/** Refetch stale queries when the app comes back to the foreground. */
export function bindAppFocus(): () => void {
  if (Platform.OS === 'web') return () => undefined;

  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });

  return () => subscription.remove();
}
