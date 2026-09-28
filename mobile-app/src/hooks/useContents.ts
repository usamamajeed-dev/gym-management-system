import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getContent, getContents } from '../api/endpoints/contents';
import { ContentPeriod, ContentType, Paginated } from '../api/types';

/** Next page number while pages remain, otherwise undefined (no more pages). */
export function nextPageParam(page: Paginated<unknown>): number | undefined {
  const { current_page, total_pages } = page.pagination;
  return current_page < total_pages ? current_page + 1 : undefined;
}

/** News or policies, "current" (published) or "archive" (older), loaded 10 at a time. */
export function useContents(type: ContentType, period: ContentPeriod) {
  return useInfiniteQuery({
    queryKey: ['contents', type, period],
    queryFn: ({ pageParam }) => getContents(type, period, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
}

export function useContent(id: number) {
  return useQuery({ queryKey: ['content', id], queryFn: () => getContent(id), enabled: Number.isFinite(id) });
}
