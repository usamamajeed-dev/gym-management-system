import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getEvent, getEvents } from '../api/endpoints/events';

/** Events overlapping a month. Without a month the API uses the current month in gym time. */
export function useEvents(month?: string) {
  return useQuery({
    queryKey: ['events', month ?? 'current'],
    queryFn: () => getEvents(month),
    placeholderData: keepPreviousData,
  });
}

export function useEvent(id: number) {
  return useQuery({ queryKey: ['event', id], queryFn: () => getEvent(id), enabled: Number.isFinite(id) });
}
