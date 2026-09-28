import { nextPageParam } from './useContents';

const page = (current_page: number, total_pages: number) => ({
  list: [],
  pagination: { total: total_pages * 10, count: 10, per_page: 10, current_page, total_pages },
});

describe('nextPageParam', () => {
  it('asks for the next page while pages remain', () => {
    expect(nextPageParam(page(1, 3))).toBe(2);
    expect(nextPageParam(page(2, 3))).toBe(3);
  });

  it('stops after the last page', () => {
    expect(nextPageParam(page(3, 3))).toBeUndefined();
    expect(nextPageParam(page(1, 1))).toBeUndefined();
  });
});
