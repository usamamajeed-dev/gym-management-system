import { screen } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

import { renderWithProviders } from '@/test-utils';

import EventDetailScreen from '../[id]';

const mockUseEvent = jest.fn();
jest.mock('@/hooks/useEvents', () => ({ useEvent: () => mockUseEvent() }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: '42' }),
  Stack: { Screen: () => null },
}));

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

describe('EventDetailScreen', () => {
  it('shows "no longer available" when the event was unpublished (404)', async () => {
    mockUseEvent.mockReturnValue({
      isPending: false,
      isError: true,
      error: new AxiosError('Not found', '404', config, null, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config,
        data: { success: false, message: 'Event not found' },
      }),
      refetch: jest.fn(),
    });

    await renderWithProviders(<EventDetailScreen />);

    expect(screen.getByText('This event is no longer available')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });

  it('shows the event details', async () => {
    mockUseEvent.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: jest.fn(),
      data: {
        id: 42,
        title: 'Morning Yoga Flow',
        description: 'Bring a mat.',
        location: 'Studio 1',
        capacity: 20,
        is_published: true,
        event_type: { value: 1, title: 'Class', color: '#2196F3' },
        starts_at: '2099-10-05T07:00:00+00:00',
        ends_at: '2099-10-05T08:00:00+00:00',
        image_url: null,
        created_at: '2026-09-01T00:00:00+00:00',
        updated_at: '2026-09-01T00:00:00+00:00',
      },
    });

    await renderWithProviders(<EventDetailScreen />);

    expect(screen.getByText('Morning Yoga Flow')).toBeTruthy();
    expect(screen.getByText('07:00 – 08:00')).toBeTruthy();
    expect(screen.getByText('Studio 1')).toBeTruthy();
    expect(screen.getByText('20 people')).toBeTruthy();
    expect(screen.queryByText('Finished')).toBeNull();
  });
});
