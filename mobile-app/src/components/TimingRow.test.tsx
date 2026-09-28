import { screen } from '@testing-library/react-native';

import { GymTiming } from '../api/types';
import { renderWithProviders } from '../test-utils';
import { TimingRow } from './TimingRow';

const sunday: GymTiming = {
  day_of_week: 0,
  day_name: 'Sunday',
  is_closed: true,
  opens_at: null,
  closes_at: null,
  updated_at: null,
};
const monday: GymTiming = {
  day_of_week: 1,
  day_name: 'Monday',
  is_closed: false,
  opens_at: '06:00',
  closes_at: '22:00',
  updated_at: null,
};

describe('TimingRow', () => {
  it('shows "Closed" for a closed day', async () => {
    await renderWithProviders(<TimingRow timing={sunday} isToday={false} />);

    expect(screen.getByText('Closed')).toBeTruthy();
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('shows the hours and highlights today', async () => {
    await renderWithProviders(<TimingRow timing={monday} isToday />);

    expect(screen.getByText('06:00 – 22:00')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByLabelText('Monday, today: 06:00 to 22:00')).toBeTruthy();
  });
});
