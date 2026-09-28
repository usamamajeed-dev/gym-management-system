import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils';

import ContentDetailScreen from '../[id]';

const mockUseContent = jest.fn();
jest.mock('@/hooks/useContents', () => ({ useContent: () => mockUseContent() }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: '7' }),
  Stack: { Screen: () => null },
}));

const base = {
  id: 7,
  slug: 'x',
  excerpt: '',
  image_url: null,
  published_at: '2026-06-01T10:00:00+00:00',
  archived_at: '2026-07-01T10:00:00+00:00',
  created_at: '2026-06-01T10:00:00+00:00',
  updated_at: '2026-07-01T10:00:00+00:00',
};

describe('ContentDetailScreen', () => {
  it('shows the archived banner and renders the body', async () => {
    mockUseContent.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: jest.fn(),
      data: {
        ...base,
        type: 'policy',
        status: 'archived',
        title: 'Old Towel Policy',
        body: '<p>Towels at <strong>reception</strong>.</p>',
      },
    });

    await renderWithProviders(<ContentDetailScreen />);

    expect(screen.getByText('This policy has been archived and may be out of date.')).toBeTruthy();
    expect(screen.getByText('Old Towel Policy')).toBeTruthy();
    expect(screen.getByText('reception')).toBeTruthy();
  });

  it('has no banner for published news', async () => {
    mockUseContent.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: jest.fn(),
      data: {
        ...base,
        type: 'news',
        status: 'published',
        archived_at: null,
        title: 'Fresh news',
        body: '<p>Hello</p>',
      },
    });

    await renderWithProviders(<ContentDetailScreen />);

    expect(screen.queryByText(/has been archived/)).toBeNull();
  });
});
