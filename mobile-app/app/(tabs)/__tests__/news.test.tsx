import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';

import * as contentsApi from '@/api/endpoints/contents';
import { renderWithProviders } from '@/test-utils';

import NewsScreen from '../news';

jest.mock('@/api/endpoints/contents');
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const api = jest.mocked(contentsApi);

const item = (id: number, title: string, status: 'published' | 'archived') => ({
  id,
  type: 'news' as const,
  title,
  slug: `n-${id}`,
  excerpt: `${title} excerpt`,
  image_url: null,
  status,
  published_at: '2026-09-01T10:00:00+00:00',
  archived_at: status === 'archived' ? '2026-09-20T10:00:00+00:00' : null,
  created_at: '2026-09-01T10:00:00+00:00',
});

describe('NewsScreen', () => {
  it('switching to "Older" requests archived news and replaces the list', async () => {
    api.getContents.mockImplementation(async (_type, period) => ({
      list: period === 'current' ? [item(1, 'Current story', 'published')] : [item(2, 'Old story', 'archived')],
      pagination: { total: 1, count: 1, per_page: 10, current_page: 1, total_pages: 1 },
    }));

    await renderWithProviders(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <NewsScreen />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Current story')).toBeTruthy();
    expect(api.getContents).toHaveBeenLastCalledWith('news', 'current', 1);

    await fireEvent.press(screen.getByText('Older'));

    expect(await screen.findByText('Old story')).toBeTruthy();
    expect(screen.queryByText('Current story')).toBeNull();
    expect(api.getContents).toHaveBeenLastCalledWith('news', 'archive', 1);
    expect(screen.getByText('Archived')).toBeTruthy();
  });
});
