import { useQuery } from '@tanstack/react-query';

import { getGymTimings } from '../api/endpoints/timings';

export function useGymTimings() {
  return useQuery({ queryKey: ['gym-timings'], queryFn: getGymTimings });
}
