import { fireEvent, render, screen } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightTheme } from '@/theme/paperTheme';

import RegisterScreen from '../register';

const mockRegister = jest.fn();

jest.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ register: mockRegister }) }));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

describe('RegisterScreen', () => {
  it('shows a server 422 on the email field', async () => {
    mockRegister.mockRejectedValue(
      new AxiosError('Unprocessable', '422', config, null, {
        status: 422,
        statusText: 'Unprocessable',
        headers: {},
        config,
        data: {
          success: false,
          message: 'Validation failed',
          errors: { email: ['An account with this email already exists.'] },
        },
      }),
    );

    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <PaperProvider theme={lightTheme}>
          <RegisterScreen />
        </PaperProvider>
      </SafeAreaProvider>,
    );

    await fireEvent.changeText(screen.getByTestId('register-name'), 'Jane Doe');
    await fireEvent.changeText(screen.getByTestId('register-email'), 'jane@example.com');
    await fireEvent.changeText(screen.getByTestId('register-phone'), '+14155552671');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'Secret@123');
    await fireEvent.changeText(screen.getByTestId('register-confirm'), 'Secret@123');
    await fireEvent.press(screen.getByText('Create account'));

    expect(await screen.findByText('An account with this email already exists.')).toBeTruthy();
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jane@example.com', phone: '+14155552671' }),
    );
  });
});
