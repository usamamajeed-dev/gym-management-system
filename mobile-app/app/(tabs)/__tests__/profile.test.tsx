import { fireEvent, screen } from '@testing-library/react-native';

import { Member } from '@/api/types';
import { renderWithProviders } from '@/test-utils';

import { ProfileBody } from '../profile';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const MEMBER: Member = {
  id: 5,
  name: 'Sara Ahmed',
  email: 'sara@example.com',
  phone: '+923001112233',
  date_of_birth: null,
  gender: null,
  address: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  membership_number: 'GYM-2026-00005',
  status: 'approved',
  is_active: true,
  approved_at: '2026-09-01T10:00:00+00:00',
  rejected_at: null,
  rejection_reason: null,
  last_login_at: null,
  created_at: '2026-08-30T10:00:00+00:00',
};

describe('ProfileBody', () => {
  it('shows the membership and "—" for empty optional fields', async () => {
    await renderWithProviders(<ProfileBody member={MEMBER} onSignOut={jest.fn()} />);

    expect(screen.getByText('GYM-2026-00005')).toBeTruthy();
    expect(screen.getByText('Member since 1 September 2026')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByTestId('detail-Phone')).toHaveTextContent('+923001112233');
    for (const label of ['Date of birth', 'Gender', 'Address', 'Emergency contact', 'Emergency phone']) {
      expect(screen.getByTestId(`detail-${label}`)).toHaveTextContent('—');
    }
    expect(screen.getByText('Contact the gym to update your details.')).toBeTruthy();
  });

  it('asks to confirm before signing out', async () => {
    const onSignOut = jest.fn();
    await renderWithProviders(<ProfileBody member={MEMBER} onSignOut={onSignOut} />);

    await fireEvent.press(screen.getByText('Sign out'));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
