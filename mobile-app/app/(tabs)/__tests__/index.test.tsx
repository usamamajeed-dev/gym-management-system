import { screen } from '@testing-library/react-native';

import { Dashboard } from '@/api/types';
import { renderWithProviders } from '@/test-utils';

import HomeScreen from '../index';

const mockUseDashboard = jest.fn();
jest.mock('@/hooks/useDashboard', () => ({ useDashboard: () => mockUseDashboard() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const EMPTY: Dashboard = {
  member: {
    id: 1,
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: null,
    date_of_birth: null,
    gender: null,
    address: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    membership_number: 'GYM-2026-00001',
    status: 'approved',
    is_active: true,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    last_login_at: null,
    created_at: '2026-09-01T10:00:00+00:00',
  },
  gym: { name: 'My Gym', timezone: 'UTC' },
  today_timing: {
    day_of_week: 0,
    day_name: 'Sunday',
    is_closed: true,
    opens_at: null,
    closes_at: null,
    updated_at: null,
  },
  is_open_now: false,
  upcoming_events: [],
  latest_news: [],
  counts: { events_this_month: 0, policies: 0 },
};

describe('HomeScreen', () => {
  it('shows the member and empty states when there are no events or news', async () => {
    mockUseDashboard.mockReturnValue({ data: EMPTY, isPending: false, isError: false, refetch: jest.fn() });

    await renderWithProviders(<HomeScreen />);

    expect(screen.getByText('Hi, Sara')).toBeTruthy();
    expect(screen.getByText('GYM-2026-00001')).toBeTruthy();
    expect(screen.getByText('Closed today')).toBeTruthy();
    expect(screen.getByText('No upcoming events')).toBeTruthy();
    expect(screen.getByText('No news yet')).toBeTruthy();
  });

  it('shows a retry state when loading fails', async () => {
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error('Offline'),
      refetch: jest.fn(),
    });

    await renderWithProviders(<HomeScreen />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
