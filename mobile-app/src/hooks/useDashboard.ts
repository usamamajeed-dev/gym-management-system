import { useQuery } from '@tanstack/react-query';

import { getDashboard } from '../api/endpoints/dashboard';

export const dashboardKey = ['dashboard'] as const;

export function useDashboard() {
  return useQuery({ queryKey: dashboardKey, queryFn: getDashboard });
}
